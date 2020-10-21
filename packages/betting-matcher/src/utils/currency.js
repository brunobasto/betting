const currency = require('currency.js');

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const real = value => brl.format(value);

const fromReal = (str) => {
	const { value } = currency(
		str,
		{
			decimal: ',',
			separator: '.',
			symbol: 'R$'
		}
	);

	return value;
}

module.exports = { real, fromReal };