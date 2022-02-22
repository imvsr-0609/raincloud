import React, { useState, useEffect, Fragment } from 'react';
import uuid from 'react-uuid';
import axios from './axios/axios';
import CurrentWeather from './components/CurrentWeather';
import DailyWeather from './components/DailyWeather';
import Loader from './components/Loader';
import cloudyday from './assets/images/cloudyday.png';
import { weatherWallpaper } from './components/WeatherWallpaper';

function App() {
	const [loading, setLoading] = useState(true);
	const [currentWeatherData, setCurrentWeatherData] = useState({});
	const [dailyWeatherData, setDailyWeatherData] = useState({});

	const [location, setLocation] = useState('');
	const [autoCompleteData, setAutoCompleteData] = useState([]);

	const fetchWeatherData = async ({ latitude, longitude }) => {
		try {
			const { data } = await axios.get(
				`/getcurrent?lat=${latitude}&lon=${longitude}`,
			);
			console.log(data.data);
			setCurrentWeatherData(data.data[0]);

			const dailyData = await axios.get(
				`/getdaily?cityid=${data.data[0].city_id}`,
			);
			console.log(dailyData.data.data);
			setDailyWeatherData(dailyData.data.data);
		} catch (err) {
			console.log(err.message);
		}
	};

	const autoComplete = async (location) => {
		const key = 'pk.8e5a8b74cd167e398fa3b41fc84feca5';
		const url = `https://api.locationiq.com/v1/autocomplete.php?key=${key}&q=${location}&format=json`;
		try {
			const { data } = await axios.get(url);
			console.log(data);
			setAutoCompleteData(data);
		} catch (err) {
			console.log(err.message);
		}
	};

	const postRequestWeather = async (postObject) => {
		setLoading(true);
		setLocation('');
		setAutoCompleteData([]);
		const { address, lat: latitude, lon: longitude } = postObject;
		const { country_code, name: city, state } = address;
		const postData = {
			city,
			state,
			country_code,
			latitude,
			longitude,
		};
		try {
			const { data } = await axios.post(`/getcurrent`, postData);
			console.log(data);
			setCurrentWeatherData(data.data[0]);

			const dailyData = await axios.get(
				`/getdaily?cityid=${data.data[0].city_id}`,
			);
			console.log(dailyData.data.data);
			setDailyWeatherData(dailyData.data.data);
			setLoading(false);
		} catch (err) {
			console.log(err.message);
		}
	};

	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { coords } = position;

				await fetchWeatherData(coords);
				setLoading(false);
			},
			async (err) => {
				await fetchWeatherData({
					latitude: '28.6139',
					longitude: '77.2090',
				});
				setLoading(false);
			},
		);
	}, []);

	useEffect(() => {
		if (location.length < 3) return;

		const autocompleteTimer = setTimeout(() => {
			autoComplete(location);
		}, 1500);
		return () => clearTimeout(autocompleteTimer);
	}, [location]);

	return (
		<div className="App grid place-items-center w-screen h-screen overflow-hidden bg-custom text-white relative">
			<div className="w-full h-full lg:max-w-5xl lg:h-4/5 xl:w-4/5 xl:h-4/5 bg-white lg:rounded-xl lg:border-8 border-black shadow-custom overflow-y-scroll lg:overflow-hidden relative">
				<img
					className="w-full h-full object-cover"
					src={weatherWallpaper[currentWeatherData.weather_icon]}
					alt={cloudyday}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-slate-900  flex flex-col justify-between p-4 sm:p-6 md:p-8 ">
					{loading ? (
						<Loader />
					) : (
						<Fragment>
							<CurrentWeather data={currentWeatherData} />

							<div className="z-20 absolute right-1/2 transform translate-x-1/2 max-w-xs ">
								<input
									className="p-1 w-full outline-none px-2 bg-transparent  placeholder-slate-100 border-opacity-40 border-2 rounded-sm text-sm border-white "
									type="text"
									value={location}
									onChange={(e) => setLocation(e.target.value.trim())}
									placeholder="Enter Location"
								/>
								{autoCompleteData.length > 0 && (
									<div className="bg-slate-800 bg-opacity-100 md:bg-opacity-10 rounded-sm overflow-hidden h-40 overflow-y-scroll">
										{autoCompleteData.map((data) => (
											<p
												key={uuid()}
												onClick={() => postRequestWeather(data)}
												className="p-2 border-b border-opacity-20 cursor-pointer hover:bg-black hover:bg-opacity-20 border-white text-xs truncate"
											>
												{data.display_name}
											</p>
										))}
									</div>
								)}
							</div>

							<DailyWeather
								offset={currentWeatherData.timezone_offset}
								data={dailyWeatherData}
							/>
						</Fragment>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
