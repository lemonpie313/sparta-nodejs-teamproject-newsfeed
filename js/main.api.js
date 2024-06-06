import axios from 'axios';

const apiRoot = axios.get({
  baseURL: 'http://localhost:3000/api/group',
}).then((response) => console.log(response.data));

export { apiRoot };