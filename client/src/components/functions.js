export const parseDate = (date, offset) => {
	var d = new Date(date);
	var millisecond = d.getTime();
	var dateString = new Date(millisecond + offset).toString();
	var dateArr = dateString.split(' ');

	return {
		date: `${dateArr[2]} ${dateArr[1]} ${dateArr[0]}`,
		time: `${dateArr[4].split(':')[0]}:${dateArr[4].split(':')[1]}`,
	};
};
