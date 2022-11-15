const axios = require('axios')

async function fetchTokenPrices(req, res){
    // const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum%2Cmatic-network&vs_currencies=usd")
    // if (response.data){
    //     res.send(response.data);
    // }

    // will use mock response instead of throttling rate limit
    const mockResponse = {
        "ethereum" : {
            "usd" : 1300
        }
    }
    res.send(mockResponse)
}

module.exports = {
    fetchTokenPrices
}