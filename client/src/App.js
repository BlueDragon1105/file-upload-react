import React from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

function App() {

    let file = React.createRef();

    const [inputData, setInputData] = React.useState({
        comment: ''
    });

    const handleInputData = (e) => {
        setInputData({...inputData, [e.target.name]: e.target.value});
    };

    const handleSubmit = (event) => {
        let formData = new FormData();
        formData.set('comment', inputData['comment']);
        formData.append('file', file.current.files[0]);
        axios({
            method: 'post',
            url: 'http://localhost:6000/api/test/sendFormData',
            data: formData,
            headers: {'Content-Type': 'multipart/form-data' }
        })
            .then(function (response) {
                //handle success
                console.log(response);
            })
            .catch(function (response) {
                //handle error
                console.log(response);
            })
            .finally(function () {
                // always executed
                // window.location.assign('/');
            });

    };

  return (
    <div style={{ padding: '30px' }}>
      <form method='post' name='myForm'>
          <input type='text' name='comment' onChange={handleInputData} /> <br /><br />
          <input type='file' name='file' ref={file} /> <br /><br />
          <button type='button' onClick={handleSubmit}>Submit</button>
      </form>
    </div>
  );
}

export default App;
