import React, { useState } from 'react';
import unknown from '../assets/icons/unknown.png';
import { parseDate } from './functions';
import { weatherIcon } from './WeatherIcon';

const SingleDayCard = ({ singleWeatherData, selected, offset }) => {
	const { humidity, max_temp, min_temp, pressure, todays_date, weather_icon } =
		singleWeatherData;

	return (
		<div
			className={`flex ${
				selected &&
				`lg:card-shadow backdrop-filter lg:backdrop-blur-sm lg:scale-125 lg:mx-6`
			} justify-around h-32 lg:w-32 flex-col items-center gap-3 p-4 lg:p-2 xl:p-4 text-xs   hover:shadow-lg px-6 backdrop-filter backdrop-blur-sm hover:scale-125 cursor-pointer transition-all duration-300 ease-in-out`}
		>
			<p>{parseDate(todays_date, offset).date}</p>

			<img
				className="w-8 h-8 object-contain invert "
				src={weatherIcon[weather_icon]}
				alt={unknown}
			/>

			<h1 className="text-xsfont-semibold ">
				{(min_temp - 273.15).toFixed(0)}°C / {(max_temp - 273.15).toFixed(0)}°C{' '}
			</h1>
		</div>
	);
};

export default SingleDayCard;
