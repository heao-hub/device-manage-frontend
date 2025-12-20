import request from './request';

// 设备分页查询
export const getDevicePage = (params) => request.get('/admin/devices/page', { params });
// 入库（新增设备）
export const addDevice = (data) => request.post('/admin/devices', data);
// 修改设备信息
export const updateDevice = (data) => request.put('/admin/devices', data);
// 根据id查询设备信息
export const getDeviceById = (id) => request.get(`/admin/devices/${id}`);
// 报废设备
export const scrapDevice = (data) => request.put('/admin/devices/scrap', data);

export default {
	getDevicePage,
	addDevice,
	updateDevice,
	getDeviceById,
	scrapDevice
};
