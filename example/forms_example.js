// Example of using the updated forms functionality with new fields
// This example shows how to save and retrieve form data with isAuto, isKabul, isJalal, and order fields

// Function to save a new form with all fields
async function saveFormWithNewFields(formData) {
  const formItem = {
    key: formData.key || `form_${Date.now()}`,
    name: formData.name,
    lastname: formData.lastname,
    fathername: formData.fathername,
    gender: formData.gender,
    birth: formData.birth,
    passport: formData.passport,
    issue: formData.issue,
    expire: formData.expire,
    job: formData.job,
    mobile: formData.mobile,
    iranPhone: formData.iranPhone,
    address: formData.address,
    iranAddress: formData.iranAddress,
    duration: formData.duration,
    entry: formData.entry,
    purpose: formData.purpose,
    arrival: formData.arrival,
    departure: formData.departure,
    photoBase64: formData.photoBase64,
    passBase64: formData.passBase64,
    tsfBase64: formData.tsfBase64,
    tsbBase64: formData.tsbBase64,
    updateBase64: formData.updateBase64,
    isAuto: formData.isAuto || false, // whether the form is auto-filled
    isKabul: formData.isKabul || false, // Kabul-specific flag
    isJalal: formData.isJalal || false, // Jalal-specific flag
    order: formData.order || 0, // order/priority number
    createtime: Date.now(),
    updatetime: Date.now()
  };

  // Send request to extension to save form data
  const result = await dbRequest('create', {
    key: formItem.key,
    value: formItem,
    table: 'forms'
  });

  if (result.success) {
    console.log('Form saved successfully');
    return result;
  } else {
    console.error('Failed to save form:', result.error);
    return null;
  }
}

// Function to update form flags
async function updateFormFlags(key, flags) {
  const existingForm = await dbRequest('read', {
    key: key,
    table: 'forms'
  });

  if (existingForm.success && existingForm.value) {
    const updatedForm = {
      ...existingForm.value,
      ...flags,
      updatetime: Date.now()
    };

    const result = await dbRequest('update', {
      key: key,
      value: updatedForm,
      table: 'forms'
    });

    if (result.success) {
      console.log('Form flags updated successfully');
      return result;
    } else {
      console.error('Failed to update form flags:', result.error);
      return null;
    }
  }
}

// Function to mark form as auto-filled
async function markFormAsAuto(key) {
  return await updateFormFlags(key, { isAuto: true });
}

// Function to mark form as Kabul
async function markFormAsKabul(key) {
  return await updateFormFlags(key, { isKabul: true });
}

// Function to mark form as Jalal
async function markFormAsJalal(key) {
  return await updateFormFlags(key, { isJalal: true });
}

// Function to update form order
async function updateFormOrder(key, order) {
  return await updateFormFlags(key, { order: order });
}

// Function to find forms by flag
async function findFormsByFlag(flagName, flagValue) {
  const allForms = await dbRequest('list', {
    table: 'forms'
  });

  if (allForms.success) {
    return allForms.value.filter(form => form[flagName] === flagValue);
  }
  return [];
}

// Function to find auto-filled forms
async function findAutoForms() {
  return await findFormsByFlag('isAuto', true);
}

// Function to find Kabul forms
async function findKabulForms() {
  return await findFormsByFlag('isKabul', true);
}

// Function to find Jalal forms
async function findJalalForms() {
  return await findFormsByFlag('isJalal', true);
}

// Function to find forms by order range
async function findFormsByOrder(minOrder, maxOrder) {
  const allForms = await dbRequest('list', {
    table: 'forms'
  });

  if (allForms.success) {
    return allForms.value.filter(form => 
      form.order >= minOrder && form.order <= maxOrder
    ).sort((a, b) => a.order - b.order);
  }
  return [];
}

// Function to get forms sorted by order
async function getFormsSortedByOrder() {
  const allForms = await dbRequest('list', {
    table: 'forms'
  });

  if (allForms.success) {
    return allForms.value.sort((a, b) => a.order - b.order);
  }
  return [];
}

// Example usage:
// 1. Save a new form with all fields
// const formData = {
//   name: "John",
//   lastname: "Doe",
//   fathername: "Mike",
//   gender: "Male",
//   birth: "1990-01-01",
//   passport: "123456789",
//   issue: "2020-01-01",
//   expire: "2030-01-01",
//   job: "Engineer",
//   mobile: "+1234567890",
//   iranPhone: "+989123456789",
//   address: "123 Main St",
//   iranAddress: "Tehran, Iran",
//   duration: "30 days",
//   entry: "2024-01-01",
//   purpose: "Tourism",
//   arrival: "2024-01-01",
//   departure: "2024-01-31",
//   isAuto: true,
//   isKabul: false,
//   isJalal: true,
//   order: 1
// };
// await saveFormWithNewFields(formData);

// 2. Mark form as auto-filled
// await markFormAsAuto('form_123');

// 3. Mark form as Kabul
// await markFormAsKabul('form_123');

// 4. Mark form as Jalal
// await markFormAsJalal('form_123');

// 5. Update form order
// await updateFormOrder('form_123', 5);

// 6. Find auto-filled forms
// const autoForms = await findAutoForms();

// 7. Find Kabul forms
// const kabulForms = await findKabulForms();

// 8. Find Jalal forms
// const jalalForms = await findJalalForms();

// 9. Find forms by order range
// const orderedForms = await findFormsByOrder(1, 10);

// 10. Get all forms sorted by order
// const sortedForms = await getFormsSortedByOrder();

// Helper function for extension communication (from the existing example)
function dbRequest(op, { key, value, table = 'forms' } = {}) {
  return new Promise((resolve) => {
    function handler(event) {
      window.removeEventListener('extension-db-response', handler);
      resolve(event.detail);
    }
    window.addEventListener('extension-db-response', handler);
    window.dispatchEvent(new CustomEvent('extension-db-request', {
      detail: { op, key, value, table }
    }));
  });
} 