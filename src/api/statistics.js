import request from './request';

// 首页设备统计
export const getDeviceStats = (params) => request.get('/statistics/device', { params });
// 设备状态统计
export const getDeviceStatusStats = () => request.get('/statistics/status/device');
// 设备使用次数TOP5统计
export const getReservationStats = () => request.get('/statistics/reservation');

export default {
	getDeviceStats,
	getDeviceStatusStats,
	getReservationStats
};
