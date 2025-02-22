from odoo.tools import formatLang
import jinja2
from jinja2 import BaseLoader
from odoo import models, fields, api
from babel.dates import format_datetime
from odoo import tools


class PosOrder(models.Model):
    _inherit = 'pos.order'

    def prepare_json_for_printer(self):
        pos_template = self.company_id.pos_template
        jinja_env = jinja2.Environment(loader=BaseLoader(), autoescape=True)
        self._add_formatters_to_jinja_env(jinja_env)
        template_content = jinja_env.from_string(pos_template).render({'order': self})
        return template_content

    def _add_formatters_to_jinja_env(self, jinja_env):
        def filter_format_currency(value):
            return formatLang(self.env, value, currency_obj=self.currency_id)

        def filter_format_int(value):
            return '{:.0f}'.format(value)

        def filter_format_datetime(value):
            lang_code = tools.get_lang(self.env).code
            return format_datetime(value, format="dd/MM/yyyy HH:mm:ss", locale=lang_code)

        jinja_env.filters['format_currency'] = filter_format_currency
        jinja_env.filters['format_datetime'] = filter_format_datetime
        jinja_env.filters['format_int'] = filter_format_int
