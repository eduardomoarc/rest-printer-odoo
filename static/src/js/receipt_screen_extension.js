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
        debugger;
        let jsonForPrinter = await this.env.services.orm.call('pos.order', 'prepare_json_for_printer', [this.get_order().id])
        console.log("jsonForPrinter");
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
                body: jsonForPrinter,
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



});

