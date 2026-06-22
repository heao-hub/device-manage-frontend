import request from './request';

// 预约设备（提交预约申请）
export const borrowDevices = (data) => request.post('/borrow/devices', data);
// 查询用户预约单记录
export const getUserBorrowOrders = (params) => request.get('/borrow/user-order/page', { params });
// 查询预约单下设备
export const getBorrowOrderDevices = (borrowOrderId) => request.get(`/borrow/devices/${borrowOrderId}`);
// 查询用户已预约/借用的设备（可选状态）
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
