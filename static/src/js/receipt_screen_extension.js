/** @odoo-module **/

import {patch} from "@web/core/utils/patch";
import {formatDateTime, serializeDateTime} from "@web/core/l10n/dates";
const { DateTime } = luxon;

import {PosStore} from "@point_of_sale/app/store/pos_store";

patch(PosStore.prototype, {

    async setup(){
      super.setup(...arguments);
    },
    async printReceipt({
                           basic = false,
                           order = this.get_order(),
                           printBillActionTriggered = false,
                       } = {}) {
        console.log("SEND TO PRINTER");
        const result = await this.env.services.orm.call('res.users', 'search_read', [], {
            domain: [['id', '=', this.session.user_id.id]],
            fields: ['printer_url'],
        })
        let printerUrl = result[0].printer_url;
        console.log("to:", printerUrl);
        let jsonForPrinter = this._prepareJsonForPrinter();
        console.log(jsonForPrinter);
        await this.sendToPrinter(printerUrl, jsonForPrinter);
        return true;
    },



    async sendToPrinter(printerUrl, jsonForPrinter) {
        try {
            const response = await this._fetchWithTimeout(printerUrl, {
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
            alert('Error al enviar a la impresora. ' + error.message);
            this.env.services.notification.add(
                'Error al enviar a la impresora. ' + error.message,
                {type: 'danger'},
            )
        }
    },

    _fetchWithTimeout(url, options = {}, timeout = 5000) {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('La solicitud ha tardado demasiado y ha sido cancelada.')), timeout)
        );

        return Promise.race([
            fetch(url, options),
            timeoutPromise
        ]);
    },

    _prepareJsonForPrinter() {
        const order = this.get_order();
        const orderTotalAmount = order.get_total_with_tax();
        const orderAmountStr = this._formatCurrencyForPrinter(orderTotalAmount);
        const dateOrder = formatDateTime(DateTime.fromFormat(order.date_order, "yyyy-MM-dd HH:mm:ss"));
        let formattedLines = this._prepareLinesJsonForPrinter();
        let formattedPaymentLines = this._preparePaymentLinesJsonForPrinter();

        return [
            {
                'type': 'text',
                'text': this.get_order().company_id.name,
                'styles': {
                    'align': 'center', 'bold': true
                }
            },
            {
                'type': 'text',
                'text': 'Empleado:' + this.get_order().user_id.name,
            },
            {
                'type': 'text',
                'text': this.get_order().name,
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
        const orderLines = this.get_order().get_orderlines();
        let formattedOrderLines = [];
        orderLines.map(line => {
            formattedOrderLines.push({
                'type': 'rows',
                'columns': [
                    {
                        'type': 'text',
                        'text': line.product_id.display_name,
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
        this.get_order().payment_ids.map(line => {
            formattedPaymentLines.push({
                'type': 'rows',
                'columns': [
                    {
                        'type': 'text',
                        'text': line.payment_method_id.name,
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

