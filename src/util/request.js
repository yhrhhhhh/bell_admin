// 引入axios
import axios from 'axios';

// 创建axios实例
const httpService = axios.create({
    baseURL:'/',
    // 请求超时时间
    timeout: 10000 // 增加超时时间到10秒
});

//添加请求和响应拦截器
// 添加请求拦截器
httpService.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.AUTHORIZATION = token;
    }
    return config;
}, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
httpService.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    return response;
}, function (error) {
    // 对响应错误做点什么
    if (error.response) {
        switch (error.response.status) {
            case 401: // token 过期
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                window.location.href = '/login';
                break;
            case 403: // 权限不足
                console.error('权限不足');
                break;
            case 404: // 接口不存在
                console.error('接口不存在');
                break;
            case 500: // 服务器错误
                console.error('服务器错误');
                break;
            default:
                console.error('未知错误');
                break;
        }
    } else if (error.request) {
        // 请求已经发出，但没有收到响应
        console.error('网络错误，请检查您的网络连接');
    } else {
        // 请求配置发生错误
        console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
});

/*网络请求部分*/

/*
 *  get请求
 *  url:请求地址
 *  params:参数
 * */
export function get(url, params = {}) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'get',
            params: params
        }).then(response => {
            resolve(response);
        }).catch(error => {
            reject(error);
        });
    });
}

/*
 *  post请求
 *  url:请求地址
 *  params:参数
 * */
export function post(url, params = {}) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'post',
            data: params
        }).then(response => {
            console.log(response)
            resolve(response);
        }).catch(error => {
            console.log(error)
            reject(error);
        });
    });
}

/*
 *  delete请求
 *  url:请求地址
 *  params:参数
 * */
export function del(url, params = {}) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'delete',
            data: params
        }).then(response => {
            console.log(response)
            resolve(response);
        }).catch(error => {
            console.log(error)
            reject(error);
        });
    });
}

/*
 *  put请求
 *  url:请求地址
 *  params:参数
 * */
export function put(url, params = {}) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'put',
            data: params
        }).then(response => {
            console.log(response)
            resolve(response);
        }).catch(error => {
            console.log(error)
            reject(error);
        });
    });
}

/*
 *  文件上传
 *  url:请求地址
 *  params:参数
 * */
export function fileUpload(url, params = {}) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'post',
            data: params,
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(response => {
            resolve(response);
        }).catch(error => {
            reject(error);
        });
    });
}

export function getServerUrl(){
    return baseUrl;
}

export default {
    get,
    post,
    put,
    del,
    fileUpload,
    getServerUrl
}
