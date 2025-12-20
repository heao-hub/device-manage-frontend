import request from './request';

// 登录
export const login = (data) => request.post('/user/login', data);
// 用户分页查询
export const getUserPage = (params) => request.get('/user/page', { params });
// 删除用户
export const deleteUser = (id) => request.delete('/user', { params: { id } });
// 新增用户
export const addUser = (data) => request.post('/user', data);
// 修改用户
export const updateUser = (data) => request.put('/user', data);
// 根据id查询用户信息
export const getUserById = (id) => request.get(`/user/${id}`);
// 退出登录
export const logout = () => request.post('/user/logout');
// 查询所有部门（用于下拉框）
export const getUserDept = () => request.get('/user/dept');

export default {
	login,
	getUserPage,
	deleteUser,
	addUser,
	updateUser,
	getUserById,
	logout,
	getUserDept
};
