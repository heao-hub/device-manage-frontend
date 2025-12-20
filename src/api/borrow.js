import request from './request';

// 借用设备
export const borrowDevices = (data) => request.post('/borrow/devices', data);
// 查询用户借条信息
export const getUserBorrowOrders = (params) => request.get('/borrow/user-order/page', { params });
// 查询借条下设备
export const getBorrowOrderDevices = (borrowOrderId) => request.get(`/borrow/devices/${borrowOrderId}`);
// 查询用户借用的设备（可选状态）
export const getUserDevices = (params) => request.get('/borrow/user-devices/page', { params });
// 归还设备
export const returnDevice = (data) => request.post('/borrow/user-back-device', data);

export default {
	borrowDevices,
	getUserBorrowOrders,
	getBorrowOrderDevices,
	getUserDevices,
	returnDevice
};
