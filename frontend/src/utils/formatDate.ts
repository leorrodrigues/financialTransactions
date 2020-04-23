import Moment from 'moment';

const formatDate = (date: Date): string => {
    return Moment(date).format('MM/DD/YYYY');
};

export default formatDate;
