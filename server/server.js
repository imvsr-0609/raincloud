const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { default: axios } = require('axios');

const db = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'Imvsr@69',
	database: 'sql_raincloud',
	port: 3306,
});

const weather_api_key = 'da33beb027fd883e7135770cdb802642';
const reverse_geocoding_key = 'pk.8e5a8b74cd167e398fa3b41fc84feca5';

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dateTimeConverter = (date) => {
	var myDate = new Date(date * 1000);
	return (
		myDate.getFullYear() +
		'-' +
		('0' + (myDate.getMonth() + 1)).slice(-2) +
		'-' +
		('0' + myDate.getDate()).slice(-2) +
		' ' +
		myDate.getHours() +
		':' +
		('0' + myDate.getMinutes()).slice(-2) +
		':' +
		myDate.getSeconds()
	);
};

const dateConverter = (date) => {
	var myDate = new Date(date * 1000);
	return (
		myDate.getFullYear() +
		'-' +
		('0' + (myDate.getMonth() + 1)).slice(-2) +
		'-' +
		('0' + myDate.getDate()).slice(-2)
	);
};

const fetchWeatherData = async (latitude, longitude) => {
	try {
		const { data } = await axios.get(
			`https://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly&lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&appid=${weather_api_key}`,
		);
		return data;
	} catch (err) {
		console.log(err);
	}
};

const fetchCityDetails = async (latitude, longitude) => {
	try {
		const { data } = await axios.get(
			`https://eu1.locationiq.com/v1/reverse.php?key=${reverse_geocoding_key}&lat=${latitude}&lon=${longitude}&format=json`,
		);
		return data;
	} catch (err) {
		console.log(err);
	}
};

const insertDailyData = (dailyWeatherData, city_id) => {
	let valueString = [];

	dailyWeatherData.forEach((daily_data) => {
		const {
			dt,
			sunrise,
			sunset,
			moonrise,
			moonset,
			temp,
			feels_like,
			pressure,
			humidity,
			wind_speed,
			weather: weather_data,
		} = daily_data;
		const { min, max } = temp;
		const { day, night } = feels_like;
		const {
			main: weather,
			description: weather_desc,
			icon: weather_icon,
		} = weather_data[0];
		valueString.push(
			`(${city_id},'${dateConverter(dt)}','${dateTimeConverter(
				sunrise,
			)}','${dateTimeConverter(sunset)}','${dateTimeConverter(
				moonrise,
			)}','${dateTimeConverter(
				moonset,
			)}',${min},${max},${day},${night},${pressure},${humidity},${wind_speed},'${weather}','${weather_desc}','${weather_icon}')`,
		);
	});

	const insertDailyQuery = `INSERT INTO daily_weather (city_id , todays_date , sunrise , sunset , moonrise , moonset , min_temp , max_temp , feels_like_day , feels_like_night,pressure , humidity , wind_speed , weather , weather_desc , weather_icon) VALUES ${valueString.join(
		',',
	)} `;
	console.log(insertDailyQuery);
	db.query(insertDailyQuery, (err, result) => {
		if (err) console.log(err);
		console.log(result);
	});
};

app.get('/getcurrent', async (req, res) => {
	console.log(req.query);
	const { lat: latitude, lon: longitude } = req.query;
	const cityDetails = await fetchCityDetails(latitude, longitude);

	const { lat, lon, address } = cityDetails;
	const { state_district, city, country_code, state } = address;
	console.log({ lat, lon, city, state_district, country_code, state });

	const existQuery = `SELECT * FROM location WHERE city = '${
		'state_district' in address ? state_district : city
	}'`;
	db.query(existQuery, async (err, result) => {
		console.log(result);
		if (result.length === 0) {
			const sqlQuery = `INSERT INTO location (city,latitude,longitude,state,country_code) VALUES('${
				'state_district' in address ? state_district : city
			}','${parseFloat(lat).toFixed(6)}','${parseFloat(lon).toFixed(
				6,
			)}','${state}','${country_code}');`;

			db.query(sqlQuery, async (err, result) => {
				console.log(result);
				const currentWeatherData = await fetchWeatherData(lat, lon);

				const {
					date,
					sunrise,
					sunset,
					temp,
					feels_like,
					pressure,
					humidity,
					visibility,
					wind_speed,
					weather: weather_data,
				} = currentWeatherData.current;
				const { timezone, daily } = currentWeatherData;

				const {
					main: weather,
					description: weather_desc,
					icon: weather_icon,
				} = weather_data[0];

				const { insertId } = result;

				const insertCurrentQuery = `INSERT INTO current_weather (city_id ,timezone , sunrise, 
					sunset ,
					temp ,
					feels_like ,
					pressure ,
					humidity ,
					visibility ,
					wind_speed ,
					weather , 
					weather_desc , 
					weather_icon) VALUES ('${insertId}','${timezone}','${dateTimeConverter(
					sunrise,
				)}','${dateTimeConverter(
					sunset,
				)}',${temp},${feels_like},${pressure},${humidity},${visibility},${wind_speed},'${weather}','${weather_desc}','${weather_icon}')`;
				console.log(insertCurrentQuery);
				db.query(insertCurrentQuery, (err, result) => {
					console.log(result);
					if (err) console.log(err);
				});
				console.log(daily);
				insertDailyData(daily, insertId);

				const fetchQuery = `SELECT current_weather.city_id, city , state , timezone , country_code , sunrise , sunset , temp ,feels_like , pressure , humidity , visibility , wind_speed ,weather , weather_desc , weather_icon FROM location  JOIN current_weather ON current_weather.city_id = '${insertId}' AND location.city_id='${insertId}'`;

				db.query(fetchQuery, (err, result) => {
					if (err) console.log(err);
					res.send(result);
				});
			});
		} else {
			const fetchQuery = `SELECT current_weather.city_id ,city , state , timezone , country_code , sunrise , sunset , temp ,feels_like , pressure , humidity , visibility , wind_speed ,weather , weather_desc , weather_icon FROM location  JOIN current_weather ON current_weather.city_id = '${result[0].city_id}' AND location.city_id='${result[0].city_id}'`;

			db.query(fetchQuery, (err, result) => {
				res.send(result);
			});
		}
		if (err) console.log(err);
	});
});

app.post('/getcurrent', async (req, res) => {
	console.log(req.body);
	// if city exist in db then return that data else fetch using lat and lon and send data.
	const { city, state, country_code, latitude, longitude } = req.body;
	const existQuery = `SELECT * FROM location WHERE city = '${city}'`;
	db.query(existQuery, async (err, result) => {
		if (result.length === 0) {
			const sqlQuery = `INSERT INTO location (city,latitude,longitude,state,country_code) VALUES('${city}','${parseFloat(
				latitude,
			).toFixed(6)}','${parseFloat(longitude).toFixed(
				6,
			)}','${state}','${country_code}')`;
			db.query(sqlQuery, async (err, result) => {
				console.log(result);
				const currentWeatherData = await fetchWeatherData(latitude, longitude);

				const {
					date,
					sunrise,
					sunset,
					temp,
					feels_like,
					pressure,
					humidity,
					visibility,
					wind_speed,
					weather: weather_data,
				} = currentWeatherData.current;
				const { timezone, daily } = currentWeatherData;

				const {
					main: weather,
					description: weather_desc,
					icon: weather_icon,
				} = weather_data[0];

				const { insertId } = result;

				const insertCurrentQuery = `INSERT INTO current_weather (city_id ,timezone , sunrise,
					sunset ,
					temp ,
					feels_like ,
					pressure ,
					humidity ,
					visibility ,
					wind_speed ,
					weather ,
					weather_desc ,
					weather_icon) VALUES ('${insertId}','${timezone}','${dateTimeConverter(
					sunrise,
				)}','${dateTimeConverter(
					sunset,
				)}',${temp},${feels_like},${pressure},${humidity},${visibility},${wind_speed},'${weather}','${weather_desc}','${weather_icon}')`;

				db.query(insertCurrentQuery, (err, result) => {
					console.log(result);
					if (err) console.log(err);
				});
				console.log(daily);
				insertDailyData(daily, insertId);

				const fetchQuery = `SELECT current_weather.city_id, city , state , timezone , country_code , sunrise , sunset , temp ,feels_like , pressure , humidity , visibility , wind_speed ,weather , weather_desc , weather_icon FROM location  JOIN current_weather ON current_weather.city_id = '${insertId}' AND location.city_id='${insertId}'`;

				db.query(fetchQuery, (err, result) => {
					if (err) console.log(err);
					res.send(result);
				});
			});
		} else {
			const fetchQuery = `SELECT current_weather.city_id, city , state , timezone , country_code , sunrise , sunset , temp ,feels_like , pressure , humidity , visibility , wind_speed ,weather , weather_desc , weather_icon FROM location  JOIN current_weather ON current_weather.city_id = '${result[0].city_id}' AND location.city_id='${result[0].city_id}'`;

			db.query(fetchQuery, (err, result) => {
				res.send(result);
			});
		}
		if (err) console.log(err);
	});
});

app.get('/getdaily', (req, res) => {
	const { cityid } = req.query;

	const fetchDailyQuery = `SELECT * FROM daily_weather WHERE city_id = '${cityid}'`;
	db.query(fetchDailyQuery, (err, result) => {
		res.send(result);
	});
});

app.listen('3001', () => {
	console.log('Server running on port 3001');
});
