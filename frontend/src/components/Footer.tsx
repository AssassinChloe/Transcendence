import React from 'react';
import '../styles/Footer.css'

function Footer() {
    return (<div className="container">
                <div className="row footer text-center">
                    <div className="col-6 pb-3"><a href="A propos">A propos</a></div>
                    <div className="col-3 pb-3"><a href="RGPD">Mentions Légales</a></div>
                </div>
            </div>
    )
}
export default Footer