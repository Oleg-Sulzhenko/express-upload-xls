import xlsx from "xlsx";
// https://stackoverflow.com/questions/76101101/xlsx-package-vulnerabilities-found-but-there-is-no-newer-package
import uploadFile from '../middleware/upload.js';
import { 
  validateUploadRequest,
  fileMimeTypeValidator, 
  validateFileDateToMatchRequestDate
} from '../middleware/uploadValidations.js';
import { mandatoryFields } from '../config/file.upload.js';


const uploadAndValidate = async (req, res, next) => {
  try {

    await uploadFile(req, res);

    validateUploadRequest(req);
    await fileMimeTypeValidator(req);

    const fileData = parseFile(req?.file?.path);
    validateFileDateToMatchRequestDate(fileData, req.body.invoicingMonth);
    
    req.parsedFileData = fileData;
    next();

  } catch (err) {
    console.log('MAIN CATCH ==>> ', err);

    if (err.code == "INVALID_FILE_TYPE") {
      return res.status(500).send({
        message: err.message,
      });
    }

    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req?.file?.originalname}.`,
      error: `${err}`
    });
  }
}

const parseFile = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    return xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: null
    })
    
  } catch (error) {
    // console.log('error PARSING: ', error)
    throw new Error('Error parsing file.', error)
  }
}

// Entries Processing:
let response = {
  InvoicingMonth: "YYYY-MM",
  currencyRates: {
    // USD: 1,
    // EUR: 2,
    // GBP: 3
  },
  invoicesData: [
    // + validationErrors:
    // + invoiceTotal:
  ]
}
const fileDataEntriesProcessing = (req, res) => {
  const  { body, parsedFileData } = req;
  let columnHeadingsMap = {};
  let rowObjects = [];

  try {
    response.InvoicingMonth = body?.invoicingMonth;

    for (let row of parsedFileData) {
      // Assume rows with currency rate information contains 'rate' keyword string.
      if(row[0]?.toLowerCase()?.includes('rate')) {
        response.currencyRates[row[0].slice(0, 3)] = row[1]
      }

      // Assume that rows headings starts with row with heading "customer" and this row comes before data Entry rows.
      if(row[0]?.toLowerCase()?.includes('customer')) {
        row.forEach((columnHeading, index) => { 
          columnHeadingsMap[index] = columnHeading.toLowerCase()
        });
      }

      rowToObject(row, rowObjects, columnHeadingsMap);
    }

    const relevantRowsWithErrors = validateRowFields(filterRelevantRows(rowObjects));

    response.invoicesData = relevantRowsWithErrors;

    res.status(200).send(response);

  } catch (error) {
    console.log('Processing error: ', error)
    res.status(500).send({ message: error?.message });
  }

}

const rowToObject = (row, rowObjects, columnHeadingsMap) => {
  const result = {};
  Object.keys(columnHeadingsMap).forEach(index => {
    const key = columnHeadingsMap[index];
    result[key] = row[index];
  });

  if(Object.keys(result).length) rowObjects.push(result);
}

const filterRelevantRows = (rowObjects) => {
  return rowObjects.filter((row) => 
    row?.status?.toLowerCase() === 'ready' || row['invoice #']
  )
}

const validateRowFields = (relevantRows) => {
  relevantRows.shift(); // remove entry with columns headings

  for (const row of relevantRows) {
  	row.validationErrors = {};
  
    validateMandatoryFields(row);

    validateSpecificFields(row);

    calculateInvoiceTotal(row);
  }

  return relevantRows;
}

const validateMandatoryFields = (row) => {
  const mandatoryFieldsLowerCase = mandatoryFields.map((fieldName) => fieldName.toLowerCase())
  
  for (const field of mandatoryFieldsLowerCase) {
    if (
      !(field in row) || 
      row[field] === null || 
      row[field] === undefined || 
      row[field] === ''
    ) {
      row.validationErrors[field] = 'Should not be empty.'
    }
  }
}

const validateSpecificFields = (row) => {
  for (const [key, value] of Object.entries(row)) {

    if (key === 'invoice currency') {
      if (!Object.keys(response.currencyRates).includes(value)) {
        setOrCombineErrors('Currency Rate is missing in a Document.', row.validationErrors, key);
      }
    }

    if (key === 'total price') {
      if(value == 0) {
        setOrCombineErrors('Should not be zero.', row.validationErrors, key);
      }
      if(typeof value !== 'number') {
        setOrCombineErrors('Should be of type number.', row.validationErrors, key);
      }
    }
    
  }

 function setOrCombineErrors(error, rowValidationErrors, key) {
    if(rowValidationErrors[key]) {
      rowValidationErrors[key] = [rowValidationErrors[key], error];
    } else {
      rowValidationErrors[key] = error;
    }
  }
}

const calculateInvoiceTotal = (row) => {

  if(row.validationErrors['invoice currency'] || row.validationErrors['total price']) return;

  const rowCurrencyRate = response.currencyRates[row['invoice currency']];
  row.invoiceTotal = row['total price'] * rowCurrencyRate;
}

export default {
  uploadAndValidate,
  fileDataEntriesProcessing
};
