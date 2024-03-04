export const fileUploadConfigs = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedFileTypes: [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
  ]
};

export const mandatoryFields = [
  'customer',
  "cust no'",
  'project type',
  'quantity',
  'price per item',
  'item price currency',
  'total price',
  'invoice currency',
  'status'
]

// export const mandatoryFieldsTypes = {
//   customer: 'string',
//   "cust no'": 'number',
//   'project type': 'string',
//   quantity: 'number',
//   'price per item': 'number',
//   'item price currency': 'string',
//   'total price': 'number',
//   'invoice currency': 'number',
//   status: 'string'
// }
