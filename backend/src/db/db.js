const mongoose = require('mongoose')


function connectedTo() {
    mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connect To MongoDB!')
    })
    .catch((errortype) => {
        console.log('Error - ',errortype)
    })
}
module.exports = connectedTo;