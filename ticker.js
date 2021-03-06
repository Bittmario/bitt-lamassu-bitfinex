var superagent = require('superagent');
var Promise = require('promise');
var _ = require('lodash');
exports.NAME = 'Bitfinex';
exports.SUPPORTED_MODULES = ['ticker'];

var API_ENDPOINT = 'https://api.bitfinex.com/v1/pubticker/';

var pluginConfig = {};
exports.config = function(localConfig){
  if(localConfig) _.merge(pluginConfig, localConfig);
}

function getTickerData(currency){
  return new Promise(function(resolve, reject){

    var symbol = getBitfinexSymbol(currency);
    superagent
    .get(API_ENDPOINT + symbol)
    .end(function(err, res){
      if(err){
        if(res.body.message){
          console.log('getTickerData error occurred; '+ res.body.message);
          return reject(res.body.message);
        } else {
          console.log('getTickerData error occurred; ' + err['response'].body.message);
          return reject((err['response'].body) && (err['response'].body).message || 'Internal server error');
        }
      };

      var result = res.body;

      if(!result){
        //console.log(result);
        return reject('Result is empty');
      }

      var prices = {};

      var askPrice = parseFloat(result.ask);
      var bidPrice = parseFloat(result.bid);
      var midPrice = parseFloat(result.mid);

      if(currency.toLowerCase() === 'bbd'){
        askPrice = askPrice * 2;
        bidPrice = bidPrice * 2;
        midPrice = midPrice * 2;
      }

      if(isNaN(askPrice) || isNaN(bidPrice)){
        return reject('Conversion error');
      }

      prices[currency.toUpperCase()]= {
        currency: currency.toUpperCase(),
        rate: midPrice,
        rates: {
          ask: askPrice,
          bid: bidPrice,
        }
      };

      //console.log(prices);
      resolve(prices);
    });
  });
}

function getBitfinexSymbol(currency){
  switch(currency.toLowerCase()){
    case 'bbd':
      return 'btcusd';

    default:
      return 'btc'+currency;
  }
}

exports.ticker = function ticker(currency, callback) {
  var tickerCurrency = currency;

  if(typeof currency === 'object'){
    tickerCurrency = currency[0] || '';
  }

  if(!tickerCurrency)
    return callback('Currency not specified');

  getTickerData(tickerCurrency).then(function(result){
    callback(null, result);
  }, function(error){
    callback(error);
  });
};
