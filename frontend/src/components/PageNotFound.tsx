import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
  
const PageNotFound: FunctionComponent = () => {
  

    return (
        <div className="center">
          
          <h1>Page not found. Be kind, rewind.</h1> 
          <Link to="/" className="waves-effect waves-teal btn-flat">
            Back to start
          </Link>
        </div>
      );
    }
  
    export default PageNotFound