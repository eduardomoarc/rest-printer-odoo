# -*- coding: utf-8 -*-
{
    'name': 'PRINTER ODOO EXTENSION',
    'version': '1.0',
    'summary': 'PRINTER ODOO EXTENSION',
    'sequence': 10,
    'description': """ """,
    'category': 'Hidden/Tools',
    'depends': ['point_of_sale', 'pos_restaurant'],
    'data': [
        'views/res_users.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'ext_printer/static/src/js/receipt_screen_extension.js',
        ],
    },
    'installable': True,
    'license': 'LGPL-3',
}
