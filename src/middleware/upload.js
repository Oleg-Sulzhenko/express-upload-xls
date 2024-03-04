import util from 'util';
import multer from 'multer';

import { fileUploadConfigs } from '../config/file.upload.js';
const { maxFileSize, allowedFileTypes } = fileUploadConfigs;


let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/resources/static/assets/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {

    // This validation only validate file extension provided by browser, not a real MIME type!
    if (!allowedFileTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file extesion, only supported: .xls, .slsx');
      error.code = 'INVALID_FILE_TYPE';

      return cb(error, false); // second argument (false) avoid saving file to storage
    }

    cb(null, true);
  }
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
export default uploadFileMiddleware;
