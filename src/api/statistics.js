import request from './request';

// 首页设备统计
export const getDeviceStats = (params) => request.get('/statistics/device', { params });
// 设备状态统计
export const getDeviceStatusStats = () => request.get('/statistics/status/device');

export default {
	getDeviceStats,
	getDeviceStatusStats
};
