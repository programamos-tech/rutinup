// Script para limpiar localStorage y cargar mocks
if (typeof window !== 'undefined') {
  localStorage.removeItem('rutinup_clients');
  localStorage.removeItem('rutinup_memberships');
  localStorage.removeItem('rutinup_membershipTypes');
  localStorage.removeItem('rutinup_payments');
  console.log('LocalStorage limpiado. Recarga la página para ver los mocks.');
}
