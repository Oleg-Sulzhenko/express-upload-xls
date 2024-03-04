import { fileTypeFromFile } from 'file-type';

import { fileUploadConfigs } from '../config/file.upload.js';
const { allowedFileTypes } = fileUploadConfigs;

 
export const validateUploadRequest = (req) => {

  if (!req.file) throw 'No file uploaded.';

  if (!req.file.path) throw 'No file path provided.';

  if (!req.body.invoicingMonth) throw 'No invoicingMonth field specified.';

  if (!isValidDate(req.body.invoicingMonth)) throw '"invoicingMonth" field value is not a valid date.';
}

export const fileMimeTypeValidator = async (req) => {
  // https://stackoverflow.com/questions/60408575/how-to-validate-file-extension-with-multer-middleware
  try {

    const meta = await fileTypeFromFile(req.file?.path);
    if(!meta) throw 'Error reading file.';
  
    if (meta && !allowedFileTypes.includes(meta?.mime)) {
      throw 'File MIME type is not allowed.';
    }
  
  } catch(err) {
    throw err;
  }
}

export const validateFileDateToMatchRequestDate = (data, invoicingMonth) => {
  // Dates match validation(date in request VS date in file uploaded)
  if(isValidDate(data[0][0])) { // Assume that very first row and column in this file is a 'invoicingMonth' date field.
    const dateFromFile = new Date(data[0][0]).setHours(0,0,0,0); 
    const dateFromRequest = new Date(invoicingMonth).setHours(0,0,0,0);
    if(dateFromFile.valueOf() !== dateFromRequest.valueOf()) {
      throw new Error('"invoicingMonth" Dates mismatch.')
    }
  } else {
    throw new Error('Date in File is Invalid.')
  }
}

const isValidDate = (date) => {
  return !isNaN(Date.parse(date)); // or use date-fns isValid()
}