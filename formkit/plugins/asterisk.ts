import type { FormKitNode, FormKitExtendableSchemaRoot, FormKitPlugin } from '@formkit/core'

const legends = ['checkbox_multi', 'radio_multi', 'repeater', 'transferlist']

export default function createAsteriskPlugin(): FormKitPlugin {
  return function asteriskPlugin(node: FormKitNode) {
    if (['button', 'submit', 'hidden', 'group', 'list', 'meta'].includes(node.props.type)) return

    node.on('created', () => {
      const legendOrLabel = legends.includes(`${node.props.type}${node.props.options ? '_multi' : ''}`) ? 'legend' : 'label'

      if (!node.props.definition) return

      if (node.props.definition?.schemaMemoKey) {
        node.props.definition.schemaMemoKey += `${node.props.options ? '_multi' : ''}_add_asterisk`
      };

      const schemaFn = node.props.definition?.schema as FormKitExtendableSchemaRoot

      node.props.definition.schema = (sectionsSchema = {}) => {
        sectionsSchema[legendOrLabel] = {
          children: ['$label', {
            $el: 'span',
            if: '$state.required',
            attrs: {
              class: 'text-tertiary',
            },
            children: ['*'],
          }],
        }

        return schemaFn(sectionsSchema)
      }
    })
  }
}
