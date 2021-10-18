const { pick, mapKeys } = require('lodash');

const createBaseRequest = require('./create-base-request.js');
const sendRequest = require('./send-request.js');

const xml2js = require('xml2js');
const { promisify } = require('util');
const xmlParser = new xml2js.Parser({ explicitArray: false, trim: true });
const parseXml = promisify(xmlParser.parseString).bind(xmlParser);
var zlib = require('zlib');

/**
 * Query previously sent invoices with invoice number or query params.
 * @async
 * @param {Object} params Function params.
 * @param {Object} params.invoiceQuery Query single invoice with invoice number.
 * @param {Object} params.technicalUser Technical user’s data.
 * @param {Object} params.softwareData Invoice software data.
 * @param {Object} params.axios Axios instance.
 * @returns {Promise<Object>} queryResults
 */
module.exports = async function queryInvoiceData({
  invoiceQuery,
  technicalUser,
  softwareData,
  axios,
}) {
  const request = createBaseRequest({
    requestType: 'QueryInvoiceDataRequest',
    technicalUser,
    softwareData,
  });

  /* Normalize invoiceQuery key order. */
  Object.assign(request.QueryInvoiceDataRequest, {
    invoiceNumberQuery: pick(invoiceQuery, [
      'invoiceNumber',
      'invoiceDirection',
    ]),
  });

  const responseData = await sendRequest({
    request,
    axios,
    path: '/queryInvoiceData',
  });

  const { invoiceDataResult } = responseData.QueryInvoiceDataResponse;

  if (!invoiceDataResult) {
    return responseData.QueryInvoiceDataResponse;
  }
  try {

    const buff = Buffer.from(invoiceDataResult.invoiceData, 'base64')
    if (invoiceDataResult.compressedContentIndicator=="true"){
      invoiceDataResult.invoiceData = await parseXml(zlib.gunzipSync(buff));
    } else {
      invoiceDataResult.invoiceData = await parseXml(buff);
    }

    return invoiceDataResult;
  } catch (err){
    console.log(err);
    return {};
  }

};
