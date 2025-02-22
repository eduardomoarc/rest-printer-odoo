from odoo import models, fields, api


class ResCompany(models.Model):
    _inherit = 'res.company'

    pos_template = fields.Text(string='Plantilla de ticket POS', default='''[
  {
    "type": "text",
    "text": "{{ order.company_id.name }}",
    "styles": {"align": "center", "bold": true}
  },

  {"type": "text", "text": "Empleado:{{ order.user_id.name }}"},
  {"type": "text", "text": "{{ order.pos_reference }}"},
  
  {% if order.partner_id.name %}
  {"type": "text", "text": "Cliente:{{ order.partner_id.name }}"},
  {% endif %}
  
  {"type": "text", "text": "----------------------------"},
  {% for line in order.lines %}
      {
        "type": "rows",
        "columns": [
          {"type": "text", "text": "{{ line.product_id.display_name }}", "width": 6},
          {
            "type": "text",
            "text": "{{ line.price_subtotal_incl|format_currency }}",
            "width": 6,
            "styles": {"align": "right"}
          }
        ]
      },
      {
        "type": "rows",
        "columns": [ {"type": "text", "text": "{{ line.qty|format_int }} x {{ (line.price_subtotal_incl / line.qty)|format_currency }}", "width": 12} ]
      },
      {"type": "text", "text": ""},
  {% endfor %}
  
  {"type": "text", "text": "----------------------------"},
  {
    "type": "rows",
    "columns": [
      {
        "type": "text",
        "text": "Total",
        "width": 6,
        "styles": {"bold": true}
      },
      {
        "type": "text",
        "text": "{{ order.amount_total|format_currency }}",
        "width": 6,
        "styles": {"align": "right", "bold": true}
      }
    ]
  },
  
  {% for payment_line in order.payment_ids %}
  {
    "type": "rows",
    "columns": [
      {"type": "text", "text": "{{ payment_line.payment_method_id.name }}", "width": 6},
      {
        "type": "text",
        "text": "{{ payment_line.amount|format_currency }}",
        "width": 6,
        "styles": {"align": "right"}
      }
    ]
  },
  {% endfor %}
  
  {"type": "text", "text": "----------------------------"},
  {"type": "text", "text": "{{ order.date_order|format_datetime }}"}
]


''')
