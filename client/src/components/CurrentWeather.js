import React from 'react';
import { TiWeatherPartlySunny } from 'react-icons/ti';
import {
	WiSunrise,
	WiSunset,
	WiHumidity,
	WiStrongWind,
	WiBarometer,
	WiCloudyWindy,
} from 'react-icons/wi';
import { weatherIcon } from './WeatherIcon';
import unknown from '../assets/icons/unknown.png';
import { parseDate } from './functions';

const CurrentWeather = ({ data, updateData }) => {
	const {
		city,
		city_id,
		country_code,
		feels_like,
		humidity,
		pressure,
		state,
		sunrise,
		sunset,
		temp,
		timezone,
		timezone_offset,
		visibility,
		weather,
		weather_desc,
		weather_icon,
		wind_speed,
	} = data;

	return (
		<div className="flex flex-col items-center md:flex-row justify-evenly md:justify-between md:items-start gap-10 flex-1 sm:p-6 lg:p-0 ">
			<div className=" flex flex-col sm:flex-row items-center md:items-start md:flex-col justify-around gap-4 md:gap-2 w-full ">
				<div className="text-center sm:text-right md:text-left">
					<div className="text-4xl flex justify-center sm:justify-end md:justify-start items-center gap-2">
						<img
							className="w-16 h-16 object-contain invert "
							src={weatherIcon[weather_icon]}
							alt={unknown}
						/>
						<div>
							<h2 className=" font-semibold">{weather}</h2>
							<p className="text-sm">{weather_desc}</p>
						</div>
					</div>

					<p className="text-lg mt-2">
						{city} - {state}{' '}
						<span className="uppercase font-semibold ml-1 text-xs">
							{country_code}
						</span>
					</p>
					<p className="text-xs">{timezone}</p>
				</div>

				<div className="flex flex-col items-center sm:items-start">
					<div className="flex items-end gap-4">
						<h1 className="text-6xl font-bold">
							{(temp - 273.15).toFixed(0)} <span className="text-4xl">°C</span>
						</h1>
					</div>
					<p className="text-sm">
						Feels Like {(feels_like - 273.15).toFixed(0)} °C
					</p>
					<div className="flex gap-4">
						<div className="flex gap-2 items-center">
							<WiSunrise className="text-xl" />
							<p>{parseDate(sunrise, timezone_offset).time}</p>
						</div>
						<div className="flex gap-2 items-center">
							<WiSunset className="text-xl" />
							<p>{parseDate(sunset, timezone_offset).time}</p>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-col gap-4 text-center md:text-left w-full md:w-40 ">
				<div className="flex justify-center md:justify-start p-3 sm:p-2 md:p-0 items-start gap-2">
					<WiHumidity className="text-xl" />

					<div className="flex flex-col">
						<p className="text-xs">Humidity</p>
						<h3 className="text-lg font-semibold">{humidity}%</h3>
					</div>
				</div>
				<div className="flex justify-center md:justify-start p-3 sm:p-2 md:p-0  items-start gap-2">
					<WiBarometer className="text-xl" />

					<div className="flex flex-col">
						<p className="text-xs">Air Pressure</p>
						<h3 className="text-lg font-semibold">{pressure} pa</h3>
					</div>
				</div>
				<div className="flex justify-center md:justify-start p-3 sm:p-2 md:p-0  items-start gap-2">
					<WiCloudyWindy className="text-xl" />

					<div className="flex flex-col">
						<p className="text-xs">Visibility</p>
						<h3 className="text-lg font-semibold">
							{(visibility / 1000).toFixed(2)} km
						</h3>
					</div>
				</div>
				<div className="flex justify-center md:justify-start p-3 sm:p-2 md:p-0  items-start gap-2">
					<WiStrongWind className="text-xl" />

					<div className="flex flex-col">
						<p className="text-xs">Wind Speed</p>
						<h3 className="text-lg font-semibold">{wind_speed} km/h</h3>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CurrentWeather;
