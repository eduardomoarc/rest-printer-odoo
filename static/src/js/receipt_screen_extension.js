/** @odoo-module **/

import {patch} from "@web/core/utils/patch";
import {session} from "@web/session";
import {useService} from "@web/core/utils/hooks";
import {ReceiptScreen} from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import {formatDateTime,} from "@web/core/l10n/dates";


patch(ReceiptScreen.prototype, {

    setup() {
        super.setup();
        this.orm = useService("orm");
        this.notification = useService("notification");
    },

    async printReceipt() {
        const result = await this.orm.call('res.users', 'search_read', [], {
            domain: [['id', '=', session.uid]],
            fields: ['printer_url'],
        })
        let printerUrl = result[0].printer_url;
        let jsonForPrinter = this._prepareJsonForPrinter();
        console.log(jsonForPrinter);
        await this.sendToPrinter(printerUrl, jsonForPrinter);
    },

    async sendToPrinter(printerUrl, jsonForPrinter) {
        try {
            const response = await this.fetchWithTimeout(printerUrl, {
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(jsonForPrinter),
                method: "POST",
                mode: 'no-cors'
            }, 5000);

            console.log('Impresión enviada correctamente.');

        } catch (error) {
            console.error('Error al enviar a la impresora:', error.message);
            this.notification.add(
                'Error al enviar a la impresora. ' + error.message,
                {type: 'danger'},
            )
        }
    },

    fetchWithTimeout(url, options = {}, timeout = 5000) {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('La solicitud ha tardado demasiado y ha sido cancelada.')), timeout)
        );

        return Promise.race([
            fetch(url, options),
            timeoutPromise
        ]);
    },

    _prepareJsonForPrinter() {
        const order = this.currentOrder;
        const orderTotalAmount = order.get_total_with_tax();
        const orderAmountStr = this._formatCurrencyForPrinter(orderTotalAmount);
        const dateOrder = formatDateTime(order.date_order);
        let formattedLines = this._prepareLinesJsonForPrinter();
        let formattedPaymentLines = this._preparePaymentLinesJsonForPrinter();

        return [
            {
                'type': 'text',
                'text': this.pos.company.name,
                'styles': {
                    'align': 'center', 'bold': true
                }
            },
            {
                'type': 'text',
                'text': 'Empleado:' + this.currentOrder.cashier.name,
            },
            {
                'type': 'text',
                'text': this.currentOrder.name,
            },
            {
                'type': 'text',
                'text': '----------------------------'
            },
            ...formattedLines,
            {
                'type': 'text',
                'text': '----------------------------'
            },
            {
                'type': 'rows',
                'columns': [
                    {
                        'type': 'text',
                        'text': 'Total',
                        'width': 6,
                        'styles': {
                            'bold': true
                        }
                    },
                    {
                        'type': 'text',
                        'text': orderAmountStr,
                        'width': 6,
                        'styles': {
                            'align': 'right', 'bold': true
                        }
                    }
                ]
            },
            ...formattedPaymentLines,
            {
                'type': 'text',
                'text': '----------------------------'
            },
            {
                'type': 'text',
                'text': dateOrder
            }
        ];
    },

    _prepareLinesJsonForPrinter() {
        const orderLines = this.currentOrder.get_orderlines();
        let formattedOrderLines = [];
        orderLines.map(line => {
            formattedOrderLines.push({
                'type': 'rows',
                'columns': [
                    {
                        'type': 'text',
                        'text': line.product.display_name,
                        'width': 6
                    },
                    {
                        'type': 'text',
                        'text': this._formatCurrencyForPrinter(line.get_price_with_tax()),
                        'width': 6,
                        'styles': {
                            'align': 'right'
                        }
                    }
                ]
            });
            formattedOrderLines.push({
                'type': 'rows',
                'columns': [
                    {
                        'type': 'text',
                        'text': `${line.get_quantity()} x ${this._formatCurrencyForPrinter(line.get_all_prices(1).priceWithTax)}`,  // Cantidad x Precio unitario
                        'width': 12  // Toda la fila
                    }
                ]
            });
            formattedOrderLines.push({
                'type': 'text',
                'text': ''
            })
        });
        return formattedOrderLines;
    },

    _preparePaymentLinesJsonForPrinter() {
        let formattedPaymentLines = [];
        this.currentOrder.get_paymentlines().map(line => {
            formattedPaymentLines.push({
                'type': 'rows',
                'columns': [
                    {
                        'type': 'text',
                        'text': line.payment_method.name,
                        'width': 6
                    },
                    {
                        'type': 'text',
                        'text': this._formatCurrencyForPrinter(line.get_amount()),
                        'width': 6,
                        'styles': {
                            'align': 'right'
                        }
                    }
                ]
            });
        });
        return formattedPaymentLines;
    },

    _formatCurrencyForPrinter(amount) {
        let amountWithCurrency = this.env.utils.formatCurrency(amount);
        return amountWithCurrency.replace(/\s+/g, "");
    }


});
