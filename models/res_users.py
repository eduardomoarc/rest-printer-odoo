from odoo import models, fields, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    printer_url = fields.Char(string='URL de impresora')
