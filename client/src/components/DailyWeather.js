import React from 'react';
import SingleDayCard from './SingleDayCard';
import uuid from 'react-uuid';
import { parseDate } from './functions';

const DailyWeather = ({ data, offset }) => {
	return (
		<div className="grid  grid-cols-2 sm:grid-cols-4 max-h-80 gap-4 backdrop-filter backdrop-blur-sm lg:flex w-full overflow-y-scroll sm:overflow-hidden  items-center">
			{data.map((singleDayWeather) => (
				<SingleDayCard
					selected={
						parseDate(singleDayWeather.todays_date, offset).date.split(
							' ',
						)[0] === new Date().toISOString().slice(0, 10).split('-')[2]
					}
					singleWeatherData={singleDayWeather}
					offset={offset}
					key={uuid()}
				/>
			))}
		</div>
	);
};

export default DailyWeather;
