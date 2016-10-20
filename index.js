var Service, Characteristic
var request = require('request')
var schedule = require('node-schedule')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-tlhumiditysensor', 'TLHumiditySensor', humiditySensorAccessory)
}

function humiditySensorAccessory (log, config) {
  this.log = log

  this.url = config['url'] || ''
  this.method = config['method'] || 'GET'
  this.timeout = config['timeout'] || 10000
  this.schedule = config['polling schedule'] || '*/1 * * * *'
  this.pollingJob = schedule.scheduleJob(this.schedule, function () {
    // 湿度取得処理
    this.httpRequest(this.url, this.method, this.timeout, function (error, response, body) {
      let bodyJson = JSON.parse(body)
      if (error || bodyJson['error']) {
        this.log('error :' + error)
        return
      }
      let humidity = bodyJson['humidity']
      // this.log('response :' + response)
      this.log('body :' + body)
      this.humiditySensorService
        .setCharacteristic(Characteristic.CurrentRelativeHumidity, humidity)
    }.bind(this))
  }.bind(this))

  this.humiditySensorService = new Service.HumiditySensor(this.name)

  this.log('[HUMIDITY SENSOR SETTINGS]')
  this.log('url                    : ' + this.url)
  this.log('method                 : ' + this.method)
  this.log('request timeout(msec)  : ' + this.timeout)
  this.log('schedule               : ' + this.schedule)
}

humiditySensorAccessory.prototype = {
  identify: function (callback) {
    this.log('Identify requested!')
    callback() // success
  },

  httpRequest: function (url, method, timeout, callback) {
    request({
      url: url,
      method: method,
      timeout: timeout
    },
    (error, response, body) => {
      callback(error, response, body)
    })
  },

  getState: function (callback) {
    this.log('get humidity...')
    // 湿度取得処理
    this.httpRequest(this.url, this.method, this.timeout, (error, response, body) => {
      let bodyJson = JSON.parse(body)
      if (error || bodyJson['error']) {
        this.log('error :' + error)
        callback(new Error('湿度の取得に失敗しました'))
        return
      }
      let humidity = bodyJson['humidity']
      // this.log('response :' + response)
      this.log('body :' + body)
      callback(null, humidity)
    })
  },

  getServices: function () {
    this.log('getServices')
    // サービスのキャラクタリスティック設定
    var informationService = new Service.AccessoryInformation()
    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Things Like Manufacturer')
      .setCharacteristic(Characteristic.Model, 'Things Like Model')
      .setCharacteristic(Characteristic.SerialNumber, 'Things Like Serial Number')

    // 現在の湿度取得時の関数割り当て
    this.humiditySensorService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getState.bind(this))

    return [informationService, this.humiditySensorService]
  }
}
