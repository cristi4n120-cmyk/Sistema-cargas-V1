
export const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDecimal = (value: number | undefined | null, minDigits = 2, maxDigits = 3) => {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits
  }).format(value);
};

export const formatDocument = (value: string | undefined) => {
  if (!value) return '';
  const v = value.replace(/\D/g, '');
  
  if (v.length > 11) {
    // CNPJ
    return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  } else {
    // CPF
    return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
};

export const maskDocument = (value: string) => {
  let v = value.replace(/\D/g, "");
  
  if (v.length <= 11) {
    // CPF Mask
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ Mask
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "-$1-$2"); // Ajuste fino para digitação
    v = v.replace(/(-\d{4})(\d+?)$/, '$1'); 
    // Simplified formatting for typing experience
    if (v.length > 18) v = v.substring(0, 18);
  }
  
  return v;
};

export const formatPhone = (value: string | undefined) => {
  if (!value) return '';
  const v = value.replace(/\D/g, "");
  if (v.length === 11) {
    return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return v.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
};

export const maskPhone = (value: string) => {
  let v = value.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v.substring(0, 15);
};

export const formatCEP = (value: string | undefined) => {
  if (!value) return '';
  const v = value.replace(/\D/g, "");
  return v.replace(/^(\d{5})(\d{3})/, "$1-$2");
};

export const maskCEP = (value: string) => {
  let v = value.replace(/\D/g, "");
  v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  return v.substring(0, 9);
};
