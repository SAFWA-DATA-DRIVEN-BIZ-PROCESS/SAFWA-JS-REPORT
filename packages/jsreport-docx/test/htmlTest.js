const should = require('should')
const fs = require('fs')
const path = require('path')
const jsreport = require('@jsreport/jsreport-core')
const WordExtractor = require('word-extractor')
const sizeOf = require('image-size')
const { getDocumentsFromDocxBuf, getTextNodesMatching, getImageEl, getImageSize } = require('./utils')
const { nodeListToArray, findChildNode, pxToEMU, cmToEMU, emuToTOAP, getDocPrEl, getPictureElInfo, getPictureCnvPrEl } = require('../lib/utils')
const { getSectionDetail } = require('../lib/sectionUtils')
const { SUPPORTED_ELEMENTS, BLOCK_ELEMENTS, ELEMENTS } = require('../lib/postprocess/html/supportedElements')
const extractor = new WordExtractor()

describe('docx html embed', () => {
  let reporter

  before(() => {
    reporter = jsreport({
      store: {
        provider: 'memory'
      }
    })
      .use(require('../')())
      .use(require('@jsreport/jsreport-handlebars')())
      .use(require('@jsreport/jsreport-assets')())
      .use(jsreport.tests.listeners())
    return reporter.init()
  })

  after(async () => {
    if (reporter) {
      await reporter.close()
    }
  })

  describe('basic - text', () => {
    it('block mode - text as root', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: 'Hello World'
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html}}')
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(1)

      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)

      should(textNodes[0].textContent).eql('Hello World')
    })

    it('block mode - unsupported element should fallback to inline element <unsupported>...<unsupported>', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: '<unsupported>Hello World</unsupported>'
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html}}')
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(1)

      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)

      should(textNodes[0].textContent).eql('Hello World')
    })

    it('inline mode - text as root', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-inline.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: 'Hello World'
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html inline=true}}')
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(1)

      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)

      should(textNodes[0].textContent).eql('Hello World')
    })

    it('inline mode - unsupported element should fallback to inline element <unsupported>...<unsupported>', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-inline.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: '<unsupported>Hello World</unsupported>'
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html inline=true}}')
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(1)

      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)

      should(textNodes[0].textContent).eql('Hello World')
    })
  })

  describe('basic - <span> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode, templateTextNodeForDocxHtml) => {
        commonHtmlTextAssertions(textNode, templateTextNodeForDocxHtml.parentNode)
      }
    }

    runCommonTests(() => reporter, 'span', opts, commonWithText)
    runCommonTests(() => reporter, 'span', opts, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'span', opts, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'span', opts, commonWithSameNestedChildren)
  })

  describe('basic - <p> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode, templateTextNodeForDocxHtml) => {
        commonHtmlTextAssertions(textNode, templateTextNodeForDocxHtml.parentNode)
      }
    }

    runCommonTests(() => reporter, 'p', opts, commonWithText)
    runCommonTests(() => reporter, 'p', opts, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'p', opts, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'p', opts, commonWithSameNestedChildren)
  })

  describe('<b> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode) => {
        should(findChildNode('w:b', findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 'b', opts, commonWithText)
    runCommonTests(() => reporter, 'b', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'b', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'b', { ...opts, targetParent: ['block'] }, commonWithSameNestedChildren)
  })

  describe('<i> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode) => {
        should(findChildNode('w:i', findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 'i', opts, commonWithText)
    runCommonTests(() => reporter, 'i', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'i', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'i', { ...opts, targetParent: ['block'] }, commonWithSameNestedChildren)
  })

  describe('<u> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode) => {
        should(findChildNode('w:u', findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 'u', opts, commonWithText)
    runCommonTests(() => reporter, 'u', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'u', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'u', { ...opts, targetParent: ['block'] }, commonWithSameNestedChildren)
  })

  describe('<b><i><u> tags', () => {
    it('block mode - combined <b><i><u>...</u></i></b>', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: 'Hello <b><i><u>World</u></i></b>'
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html}}')
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(2)

      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)

      should(textNodes[0].textContent).eql('Hello ')
      should(textNodes[1].textContent).eql('World')
      should(findChildNode('w:b', findChildNode('w:rPr', textNodes[1].parentNode))).be.ok()
      should(findChildNode('w:i', findChildNode('w:rPr', textNodes[1].parentNode))).be.ok()
      should(findChildNode('w:u', findChildNode('w:rPr', textNodes[1].parentNode))).be.ok()
    })

    it('inline mode - combined <b><i><u>...</u></i></b>', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-inline.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: 'Hello <b><i><u>World</u></i></b>'
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html inline=true}}')
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(2)

      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)

      should(textNodes[0].textContent).eql('Hello ')
      should(textNodes[1].textContent).eql('World')
      should(findChildNode('w:b', findChildNode('w:rPr', textNodes[1].parentNode))).be.ok()
      should(findChildNode('w:i', findChildNode('w:rPr', textNodes[1].parentNode))).be.ok()
      should(findChildNode('w:u', findChildNode('w:rPr', textNodes[1].parentNode))).be.ok()
    })
  })

  describe('<br> tag', () => {
    for (const mode of ['block', 'inline']) {
      const templateStr = '<br />'

      it(`${mode} mode - <br> ${templateStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

        const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

        should(runNodes.length).eql(1)

        should(findChildNode('w:br', runNodes[0])).be.ok()

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(0)
      })

      const templateMultipleStr = '<br /><br />'

      it(`${mode} mode - <br> ${templateMultipleStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateMultipleStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

        const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

        should(runNodes.length).eql(2)

        should(findChildNode('w:br', runNodes[0])).be.ok()
        should(findChildNode('w:br', runNodes[1])).be.ok()

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(0)
      })

      const templateTextStr = '...<br />...'

      it(`${mode} mode - <br> with text ${templateTextStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateTextStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

        const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

        should(runNodes.length).eql(3)

        should(findChildNode('w:br', runNodes[1])).be.ok()

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(2)

        should(textNodes[0].textContent).eql('Hello')
        should(textNodes[1].textContent).eql('World')
      })
    }
  })

  describe('<sub> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode) => {
        should(findChildNode((n) => (
          n.nodeName === 'w:vertAlign' &&
          n.getAttribute('w:val') === 'subscript'
        ), findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 'sub', opts, commonWithText)
    runCommonTests(() => reporter, 'sub', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'sub', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'sub', { ...opts, targetParent: ['block'] }, commonWithSameNestedChildren)
  })

  describe('<sup> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode) => {
        should(findChildNode((n) => (
          n.nodeName === 'w:vertAlign' &&
          n.getAttribute('w:val') === 'superscript'
        ), findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 'sup', opts, commonWithText)
    runCommonTests(() => reporter, 'sup', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'sup', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'sup', { ...opts, targetParent: ['block'] }, commonWithSameNestedChildren)
  })

  describe('<s> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode) => {
        should(findChildNode('w:strike', findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 's', opts, commonWithText)
    runCommonTests(() => reporter, 's', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 's', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 's', { ...opts, targetParent: ['block'] }, commonWithSameNestedChildren)
  })

  describe('<code> tag', () => {
    const opts = {
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode) => {
        should(findChildNode((n) => (
          n.nodeName === 'w:highlight' &&
          n.getAttribute('w:val') === 'lightGray'
        ), findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 'code', opts, commonWithText)
    runCommonTests(() => reporter, 'code', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'code', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)
    runCommonTests(() => reporter, 'code', { ...opts, targetParent: ['block'] }, commonWithSameNestedChildren)
  })

  describe('<a> tag', () => {
    const opts = {
      outputDocuments: ['word/styles.xml', 'word/_rels/document.xml.rels', 'word/_rels/header1.xml.rels', 'word/_rels/header2.xml.rels', 'word/_rels/header3.xml.rels', 'word/_rels/footer1.xml.rels', 'word/_rels/footer2.xml.rels', 'word/_rels/footer3.xml.rels'],
      paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml) => {
        commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
      },
      textAssert: (textNode, templateTextNodeForDocxHtml, extra) => {
        const rStyle = findChildNode('w:rStyle', findChildNode('w:rPr', textNode.parentNode))

        should(rStyle).be.ok()

        const linkStyleId = rStyle.getAttribute('w:val')

        const [stylesDoc, documentRelsDoc, header1RelsDoc, header2RelsDoc, header3RelsDoc, footer1RelsDoc, footer2RelsDoc, footer3RelsDoc] = extra.outputDocuments

        should(findChildNode((n) => (
          n.nodeName === 'w:style' &&
          n.getAttribute('w:type') === 'character' &&
          n.getAttribute('w:styleId') === linkStyleId &&
          findChildNode((cN) => cN.nodeName === 'w:name' && cN.getAttribute('w:val') === 'Hyperlink', n) != null
        ), stylesDoc.documentElement)).be.ok()

        const hyperlinkEl = textNode.parentNode.parentNode

        should(hyperlinkEl.nodeName).eql('w:hyperlink')

        const linkRelVal = hyperlinkEl.getAttribute('r:id')

        should(linkRelVal).be.ok()
        should(linkRelVal !== '').be.True()

        const relsDocs = [
          documentRelsDoc,
          header1RelsDoc,
          header2RelsDoc,
          header3RelsDoc,
          footer1RelsDoc,
          footer2RelsDoc,
          footer3RelsDoc
        ]

        relsDocs.should.matchAny((relsDoc) => {
          should(relsDoc).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'Relationship' &&
            n.getAttribute('Id') === linkRelVal &&
            n.getAttribute('Type') === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'
          ), relsDoc.documentElement)).be.ok()
        })
      }
    }

    runCommonTests(() => reporter, 'a', opts, commonWithText)
    runCommonTests(() => reporter, 'a', { ...opts, targetParent: ['block'] }, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'a', { ...opts, targetParent: ['block'] }, commonWithInlineBlockChildren)

    const outputDocuments = opts.outputDocuments
    const paragraphAssert = opts.paragraphAssert
    const textAssert = opts.textAssert

    for (const mode of ['block', 'inline']) {
      const templateStr = 'some <a href="https://jsreport.net">link</a>'

      it(`${mode} mode - <a> with href ${templateStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])
        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        const assertExtra = {
          mode,
          outputDocuments: restOfDocuments
        }

        const documentRelsDoc = restOfDocuments[1]

        should(paragraphNodes.length).eql(1)

        paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(2)

        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('some ')

        textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodes[1].textContent).eql('link')

        const hyperlinkEl = textNodes[1].parentNode.parentNode

        should(hyperlinkEl.nodeName).eql('w:hyperlink')

        const linkRelVal = hyperlinkEl.getAttribute('r:id')

        should(findChildNode((n) => (
          n.nodeName === 'Relationship' &&
          n.getAttribute('Id') === linkRelVal &&
          n.getAttribute('Type') === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink' &&
          n.getAttribute('Target') === 'https://jsreport.net' &&
          n.getAttribute('TargetMode') === 'External'
        ), documentRelsDoc.documentElement)).be.ok()
      })
    }
  })

  describe('<pre> tag', () => {
    const opts = {
      textAssert: (textNode) => {
        should(findChildNode((n) => (
          n.nodeName === 'w:rFonts' &&
          n.getAttribute('w:ascii') === 'Courier' &&
          n.getAttribute('w:hAnsi') === 'Courier'
        ), findChildNode('w:rPr', textNode.parentNode))).be.ok()
      }
    }

    runCommonTests(() => reporter, 'pre', opts, commonWithText)
    runCommonTests(() => reporter, 'pre', opts, commonWithInlineAndBlockSiblings)
    runCommonTests(() => reporter, 'pre', opts, commonWithInlineBlockChildren)

    for (const mode of ['block', 'inline']) {
      const templateStr = '<pre>\nText in a pre element\nis displayed in a fixed-width\nfont, and it preserves\nboth      spaces and\nline breaks\n</pre>'

      it(`${mode} mode - <pre> text with line breaks ${templateStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

        const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

        should(runNodes.length).eql(10)

        should(findChildNode('w:br', runNodes[1])).be.ok()
        should(findChildNode('w:br', runNodes[3])).be.ok()
        should(findChildNode('w:br', runNodes[5])).be.ok()
        should(findChildNode('w:br', runNodes[7])).be.ok()
        should(findChildNode('w:br', runNodes[9])).be.ok()

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(5)

        should(textNodes[0].textContent).eql('Text in a pre element')
        should(textNodes[1].textContent).eql('is displayed in a fixed-width')
        should(textNodes[2].textContent).eql('font, and it preserves')
        should(textNodes[3].textContent).eql('both      spaces and')
        should(textNodes[4].textContent).eql('line breaks')
      })
    }
  })

  for (const headingLevel of ['1', '2', '3', '4', '5', '6']) {
    describe(`<h${headingLevel}> tag`, () => {
      const opts = {
        outputDocuments: ['word/styles.xml'],
        paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml, extra) => {
          const mode = extra.mode

          if (mode === 'block') {
            const [stylesDoc] = extra.outputDocuments
            const pPrNode = findChildNode('w:pPr', paragraphNode)
            const pStyleNode = findChildNode('w:pStyle', pPrNode)
            const titleStyleId = pStyleNode.getAttribute('w:val')
            const titleLevel = parseInt(titleStyleId.match(/\w+(\d)$/)[1], 10)

            should(titleLevel).be.Number()
            should(titleLevel).be.eql(parseInt(headingLevel, 10))
            should(titleLevel).be.not.NaN()

            const titleStyleNode = findChildNode((n) => (
              n.nodeName === 'w:style' &&
              n.getAttribute('w:type') === 'paragraph' &&
              n.getAttribute('w:styleId') === titleStyleId
            ), stylesDoc.documentElement)

            should(titleStyleNode).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:name' &&
              n.getAttribute('w:val') === `heading ${titleLevel}`
            ), titleStyleNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:basedOn' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), titleStyleNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:next' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), titleStyleNode)).be.ok()

            const linkNode = findChildNode((n) => (
              n.nodeName === 'w:link' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), titleStyleNode)

            should(linkNode).be.ok()

            const titleCharStyleId = linkNode.getAttribute('w:val')

            should(findChildNode((n) => (
              n.nodeName === 'w:style' &&
              n.getAttribute('w:type') === 'character' &&
              n.getAttribute('w:styleId') === titleCharStyleId
            ), stylesDoc.documentElement)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:uiPriority' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), titleStyleNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:qFormat'
            ), titleStyleNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:pPr'
            ), titleStyleNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:rPr'
            ), titleStyleNode)).be.ok()
          } else {
            commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
          }
        }
      }

      const customOptsForText = { ...opts }

      if (headingLevel !== '1') {
        customOptsForText.targetParent = [null]
      }

      // for h1 we run full tests, for h2 to h6 we want to run less tests
      runCommonTests(() => reporter, `h${headingLevel}`, customOptsForText, commonWithText)

      if (headingLevel === '1') {
        runCommonTests(() => reporter, `h${headingLevel}`, opts, commonWithInlineAndBlockSiblings)
        runCommonTests(() => reporter, `h${headingLevel}`, opts, commonWithInlineBlockChildren)
      }
    })
  }

  describe('<h1> - <h6> tags', () => {
    it('block mode - combined <h1>...</h1>...<h2>...</h2>...<h3>...</h3>...<h4>...</h4>...<h5>...</h5>...<h6>...</h6>...', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: [
            '<h1>Testing title</h1>',
            'another text',
            '<h2>Testing title2</h2>',
            'another text',
            '<h3>Testing title3</h3>',
            'another text',
            '<h4>Testing title4</h4>',
            'another text',
            '<h5>Testing title5</h5>',
            'another text',
            '<h6>Testing title6</h6>',
            'another text'
          ].join('')
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [doc, stylesDoc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/styles.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(12)

      for (const [paragraphIdx, paragraphNode] of paragraphNodes.entries()) {
        const isOdd = paragraphIdx % 2 === 0
        const textNodes = nodeListToArray(paragraphNode.getElementsByTagName('w:t'))
        should(textNodes.length).eql(1)

        if (isOdd) {
          const pPrNode = findChildNode('w:pPr', paragraphNode)
          const pStyleNode = findChildNode('w:pStyle', pPrNode)
          const titleStyleId = pStyleNode.getAttribute('w:val')
          const titleLevel = parseInt(titleStyleId.match(/\w+(\d)$/)[1], 10)

          should(titleLevel).be.Number()
          should(titleLevel).be.not.NaN()
          should(textNodes[0].textContent).eql(`Testing title${titleLevel === 1 ? '' : titleLevel}`)

          const titleStyleNode = findChildNode((n) => (
            n.nodeName === 'w:style' &&
            n.getAttribute('w:type') === 'paragraph' &&
            n.getAttribute('w:styleId') === titleStyleId
          ), stylesDoc.documentElement)

          should(titleStyleNode).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'w:name' &&
            n.getAttribute('w:val') === `heading ${titleLevel}`
          ), titleStyleNode)).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'w:basedOn' &&
            n.getAttribute('w:val') != null &&
            n.getAttribute('w:val') !== ''
          ), titleStyleNode)).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'w:next' &&
            n.getAttribute('w:val') != null &&
            n.getAttribute('w:val') !== ''
          ), titleStyleNode)).be.ok()

          const linkNode = findChildNode((n) => (
            n.nodeName === 'w:link' &&
            n.getAttribute('w:val') != null &&
            n.getAttribute('w:val') !== ''
          ), titleStyleNode)

          should(linkNode).be.ok()

          const titleCharStyleId = linkNode.getAttribute('w:val')

          should(findChildNode((n) => (
            n.nodeName === 'w:style' &&
            n.getAttribute('w:type') === 'character' &&
            n.getAttribute('w:styleId') === titleCharStyleId
          ), stylesDoc.documentElement)).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'w:uiPriority' &&
            n.getAttribute('w:val') != null &&
            n.getAttribute('w:val') !== ''
          ), titleStyleNode)).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'w:qFormat'
          ), titleStyleNode)).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'w:pPr'
          ), titleStyleNode)).be.ok()

          should(findChildNode((n) => (
            n.nodeName === 'w:rPr'
          ), titleStyleNode)).be.ok()
        } else {
          should(textNodes[0].textContent).eql('another text')
        }
      }
    })

    it('inline mode - combined <h1>...</h1>...<h2>...</h2>...<h3>...</h3>...<h4>...</h4>...<h5>...</h5>...<h6>...</h6>...', async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-inline.docx'))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: [
            '<h1>Testing title</h1>',
            'another text',
            '<h2>Testing title2</h2>',
            'another text',
            '<h3>Testing title3</h3>',
            'another text',
            '<h4>Testing title4</h4>',
            'another text',
            '<h5>Testing title5</h5>',
            'another text',
            '<h6>Testing title6</h6>',
            'another text'
          ].join('')
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(12)

      should(textNodes[0].textContent).eql('Testing title')
      should(textNodes[1].textContent).eql('another text')
      should(textNodes[2].textContent).eql('Testing title2')
      should(textNodes[3].textContent).eql('another text')
      should(textNodes[4].textContent).eql('Testing title3')
      should(textNodes[5].textContent).eql('another text')
      should(textNodes[6].textContent).eql('Testing title4')
      should(textNodes[7].textContent).eql('another text')
      should(textNodes[8].textContent).eql('Testing title5')
      should(textNodes[9].textContent).eql('another text')
      should(textNodes[10].textContent).eql('Testing title6')
      should(textNodes[11].textContent).eql('another text')
    })
  })

  describe('<table>, <tr>, <td>', () => {
    const generateRows = (amountOfCols, amountOfRows = 1, cellTag = 'td') => {
      const rows = []

      for (let i = 0; i < amountOfRows; i++) {
        const cells = []

        for (let j = 0; j < amountOfCols; j++) {
          cells.push(`<${cellTag}>col${i + 1}-${j + 1}</${cellTag}>`)
        }

        rows.push(`<tr>${cells.join('')}</tr>`)
      }

      return rows
    }

    const getValueForTest = (values) => (unit) => {
      const item = values.find((val) => val.unit === unit)

      if (item == null) {
        throw new Error(`Unit "${unit}" is not supported`)
      }

      return item.value
    }

    const getValueInDXAForTest = (value, unit, docOrNumber) => {
      const numberValue = parseFloat(value)

      if (isNaN(numberValue)) {
        throw new Error('Invalid value input', value)
      }

      switch (unit) {
        case 'px':
          return Math.round(emuToTOAP(pxToEMU(numberValue)))
        case 'cm':
          return Math.round(emuToTOAP(cmToEMU(numberValue)))
        case '%': {
          if (docOrNumber == null) {
            throw new Error(`docOrNumber param is required when unit "${unit}" to get value in DXA`)
          }

          let containerWidth

          if (typeof docOrNumber === 'number') {
            containerWidth = docOrNumber
          } else {
            const sectPtEl = docOrNumber.getElementsByTagName('w:sectPr')[0]
            const sectionDetail = getSectionDetail(sectPtEl, { includesHeaderFooterReferences: false })
            containerWidth = sectionDetail.colsWidth[0]
          }

          return Math.round((numberValue / 100) * containerWidth)
        }
      }
    }

    const modes = ['block', 'inline']

    for (const mode of modes) {
      it(`${mode} mode - <table> with row`, async () => {
        const templateStr = [
          '<table>',
          generateRows(3).join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(3)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with multiple rows`, async () => {
        const templateStr = [
          '<table>',
          generateRows(3, 3).join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(9)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with multiple rows and columns`, async () => {
        const templateStr = [
          '<table>',
          generateRows(6, 3).join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(18)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 6) + 1
            let cellIdx = idx % 6
            cellIdx = cellIdx === 0 ? 6 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(6)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(6)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with th`, async () => {
        const templateStr = [
          '<table>',
          generateRows(3, 2, 'th').join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(6)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with thead`, async () => {
        const templateStr = [
          '<table>',
          `<thead>${generateRows(3, 2).join('')}</thead>`,
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(6)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with tfoot`, async () => {
        const templateStr = [
          '<table>',
          `<tfoot>${generateRows(3, 2).join('')}</tfoot>`,
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(6)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with tbody`, async () => {
        const templateStr = [
          '<table>',
          `<tbody>${generateRows(3, 2).join('')}</tbody>`,
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(6)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with thead, tbody and tfoot`, async () => {
        const templateStr = [
          '<table>',
          `<thead>${generateRows(3, 2).join('')}</thead>`,
          `<tbody>${generateRows(3, 2).join('')}</tbody>`,
          `<tfoot>${generateRows(3, 2).join('')}</tfoot>`,
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(18)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor((runIdx / 3) % 2) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(6)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            const targetRowIdx = rowIdx % 2

            should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> in document header`, async () => {
        const templateStr = [
          '<table>',
          generateRows(3, 3).join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block-header' : 'html-embed-inline-header'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, []),
            headerHtml: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc, header1Doc, header2Doc, header3Doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml'])

        const targetDocs = [{ doc }]

        const headerInfos = [
          { doc: header1Doc },
          { doc: header2Doc },
          { doc: header3Doc }
        ]

        for (const headerInfo of headerInfos) {
          if (headerInfo.doc == null) {
            continue
          }

          if (!headerInfo.doc.documentElement.textContent.includes('col1-1')) {
            continue
          }

          targetDocs.push(headerInfo)
        }

        should(targetDocs.length).be.eql(2)

        for (const [idx, { doc }] of targetDocs.entries()) {
          const containerNode = idx === 0 ? doc.getElementsByTagName('w:body')[0] : doc.documentElement
          const paragraphAtRootNodes = nodeListToArray(containerNode.childNodes).filter((el) => el.nodeName === 'w:p')

          should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

          const tableAtRootNodes = nodeListToArray(containerNode.childNodes).filter((el) => el.nodeName === 'w:tbl')

          should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

          if (mode !== 'block') {
            const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(9)

            for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
              const idx = runIdx + 1
              const runNode = runNodes[runIdx]
              const textNode = runNode.getElementsByTagName('w:t')[0]
              const rowIdx = Math.floor(runIdx / 3) + 1
              let cellIdx = idx % 3
              cellIdx = cellIdx === 0 ? 3 : cellIdx
              should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
            }

            return
          }

          const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
          const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

          should(gridColNodes.length).be.eql(3)

          const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

          should(rowNodes.length).be.eql(3)

          for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
            const rowNode = rowNodes[rowIdx]
            const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

            should(cellNodes.length).be.eql(3)

            for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
              const cellNode = cellNodes[cellIdx]
              const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

              should(paragraphNodes.length).be.eql(1)

              const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

              should(runNodes.length).be.eql(1)

              const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

              should(textNodes.length).be.eql(1)

              should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
            }
          }
        }
      })

      it(`${mode} mode - <table> in document footer`, async () => {
        const templateStr = [
          '<table>',
          generateRows(3, 3).join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block-footer' : 'html-embed-inline-footer'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, []),
            footerHtml: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc, footer1Doc, footer2Doc, footer3Doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'])

        const targetDocs = [{ doc }]

        const footerInfos = [
          { doc: footer1Doc },
          { doc: footer2Doc },
          { doc: footer3Doc }
        ]

        for (const footerInfo of footerInfos) {
          if (footerInfo.doc == null) {
            continue
          }

          if (!footerInfo.doc.documentElement.textContent.includes('col1-1')) {
            continue
          }

          targetDocs.push(footerInfo)
        }

        should(targetDocs.length).be.eql(2)

        for (const [idx, { doc }] of targetDocs.entries()) {
          const containerNode = idx === 0 ? doc.getElementsByTagName('w:body')[0] : doc.documentElement
          const paragraphAtRootNodes = nodeListToArray(containerNode.childNodes).filter((el) => el.nodeName === 'w:p')

          should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

          const tableAtRootNodes = nodeListToArray(containerNode.childNodes).filter((el) => el.nodeName === 'w:tbl')

          should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

          if (mode !== 'block') {
            const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(9)

            for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
              const idx = runIdx + 1
              const runNode = runNodes[runIdx]
              const textNode = runNode.getElementsByTagName('w:t')[0]
              const rowIdx = Math.floor(runIdx / 3) + 1
              let cellIdx = idx % 3
              cellIdx = cellIdx === 0 ? 3 : cellIdx
              should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
            }

            return
          }

          const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
          const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

          should(gridColNodes.length).be.eql(3)

          const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

          should(rowNodes.length).be.eql(3)

          for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
            const rowNode = rowNodes[rowIdx]
            const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

            should(cellNodes.length).be.eql(3)

            for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
              const cellNode = cellNodes[cellIdx]
              const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

              should(paragraphNodes.length).be.eql(1)

              const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

              should(runNodes.length).be.eql(1)

              const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

              should(textNodes.length).be.eql(1)

              should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
            }
          }
        }
      })

      it(`${mode} mode - <table> in document header and footer`, async () => {
        const templateStr = [
          '<table>',
          generateRows(3, 3).join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block-header-footer' : 'html-embed-inline-header-footer'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, []),
            headerHtml: createHtml(templateStr, []),
            footerHtml: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc, header1Doc, header2Doc, header3Doc, footer1Doc, footer2Doc, footer3Doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'])

        const targetDocs = [{ doc }]

        const headerFooterInfos = [
          { doc: header1Doc },
          { doc: header2Doc },
          { doc: header3Doc },
          { doc: footer1Doc },
          { doc: footer2Doc },
          { doc: footer3Doc }
        ]

        for (const headerFooterInfo of headerFooterInfos) {
          if (headerFooterInfo.doc == null) {
            continue
          }

          if (!headerFooterInfo.doc.documentElement.textContent.includes('col1-1')) {
            continue
          }

          targetDocs.push(headerFooterInfo)
        }

        should(targetDocs.length).be.eql(3)

        for (const [idx, { doc }] of targetDocs.entries()) {
          const containerNode = idx === 0 ? doc.getElementsByTagName('w:body')[0] : doc.documentElement
          const paragraphAtRootNodes = nodeListToArray(containerNode.childNodes).filter((el) => el.nodeName === 'w:p')

          should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

          const tableAtRootNodes = nodeListToArray(containerNode.childNodes).filter((el) => el.nodeName === 'w:tbl')

          should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

          if (mode !== 'block') {
            const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(9)

            for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
              const idx = runIdx + 1
              const runNode = runNodes[runIdx]
              const textNode = runNode.getElementsByTagName('w:t')[0]
              const rowIdx = Math.floor(runIdx / 3) + 1
              let cellIdx = idx % 3
              cellIdx = cellIdx === 0 ? 3 : cellIdx
              should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
            }

            return
          }

          const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
          const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

          should(gridColNodes.length).be.eql(3)

          const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

          should(rowNodes.length).be.eql(3)

          for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
            const rowNode = rowNodes[rowIdx]
            const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

            should(cellNodes.length).be.eql(3)

            for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
              const cellNode = cellNodes[cellIdx]
              const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

              should(paragraphNodes.length).be.eql(1)

              const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

              should(runNodes.length).be.eql(1)

              const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

              should(textNodes.length).be.eql(1)

              should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
            }
          }
        }
      })

      it(`${mode} mode - <table> with rows that have different cells count`, async () => {
        const templateStr = [
          '<table>',
          generateRows(3, 1).join(''),
          generateRows(6, 1).join(''),
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(9)

          const targetRunNodes = [runNodes.slice(0, 3), runNodes.slice(3)]

          for (const [cIdx, rNodes] of targetRunNodes.entries()) {
            for (let runIdx = 0; runIdx < rNodes.length; runIdx++) {
              const idx = runIdx + 1
              const runNode = rNodes[runIdx]
              const textNode = runNode.getElementsByTagName('w:t')[0]
              const cellsCount = cIdx === 0 ? 3 : 6
              const rowIdx = Math.floor(runIdx / cellsCount) + 1
              let cellIdx = idx % cellsCount
              cellIdx = cellIdx === 0 ? cellsCount : cellIdx
              should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
            }
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(6)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 6)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            const expectedRowIdx = (rowIdx > 0 ? rowIdx - 1 : rowIdx) + 1

            should(textNodes[0].textContent).be.eql(`col${expectedRowIdx}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> with empty cell`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td></td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(0)

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(1)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(1)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql('')
          }
        }
      })

      it(`${mode} mode - <table> with empty cells`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td></td>',
          '<td></td>',
          '<td></td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(0)

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql('')
          }
        }
      })

      it(`${mode} mode - <table> empty (no rows) should not produce table at all`, async () => {
        const templateStr = [
          '<table>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(0)
      })

      it(`${mode} mode - <table> with only empty row should not produce table at all`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(0)
      })

      it(`${mode} mode - <table> with empty row and normal rows should ignore the empty rows`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '<td>col3-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col3-1', 'col3-2', 'col3-3']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(targetTexts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> with strange children elements betweens rows should be ignored in table but parsed in another place like browsers`, async () => {
        const templateStr = [
          '<table>',
          '<p>demo</p>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<p>demo</p>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 2 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['demo', 'demo', 'col1-1', 'col1-2', 'col1-3']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(targetTexts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        for (const paragraphAtRootNode of paragraphAtRootNodes) {
          const runNodes = nodeListToArray(paragraphAtRootNode.getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(1)

          const textNodes = nodeListToArray(runNodes[0].getElementsByTagName('w:t'))

          should(textNodes.length).be.eql(1)

          should(textNodes[0].textContent).be.eql('demo')
        }

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        let targetTextIdx = -1

        const tableTexts = targetTexts.slice(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(tableTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td negative colspan set should default to as if there was no colspan set`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="-2">col1-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(3)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 3)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)

            should(gridSpanNode).be.not.ok()

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set on single row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="2">col1-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(3)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 3)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)

            should(gridSpanNode).be.not.ok()

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set but not enough cells available in next row (diff 0)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="2">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(6)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 3)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)

            should(gridSpanNode).be.not.ok()

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set but not enough cells available in next row (diff > 0)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="3">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))
          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col2-4']

          should(runNodes.length).be.eql(targetTexts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)

            if (rowIdx === 0 && cellIdx === 2) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
            } else {
              should(gridSpanNode).be.not.ok()
            }

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the start of first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td colspan="2">col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(7)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col2-4']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td decimal colspan set should default to just integer part`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="2.9">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(7)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col2-4']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)

            if (rowIdx === 0 && cellIdx === 2) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
            } else {
              should(gridSpanNode).be.not.ok()
            }

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set to 0 should default to as if there was no colspan set`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="0">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(targetTexts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 3)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)

            should(gridSpanNode).be.not.ok()

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set in the middle of first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td colspan="2">col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(7)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col2-4']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && cellIdx === 1) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the end of first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="2">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(7)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col2-4']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && cellIdx === 2) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the start of last row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td colspan="2">col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(7)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', 'col2-1', 'col2-2', 'col2-3']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 4 : 3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 1 && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the middle of last row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td colspan="2">col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(7)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', 'col2-1', 'col2-2', 'col2-3']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 4 : 3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 1 && cellIdx === 1) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the end of last row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td colspan="2">col2-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(7)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', 'col2-1', 'col2-2', 'col2-3']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 4 : 3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 1 && cellIdx === 2) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the start of middle row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td colspan="2">col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '<td>col3-3</td>',
          '<td>col3-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(11)

          const targetTexts = [
            'col1-1', 'col1-2', 'col1-3', 'col1-4',
            'col2-1', 'col2-2', 'col2-3',
            'col3-1', 'col3-2', 'col3-3', 'col3-4'
          ]

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 1 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 1 && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the middle of middle row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td colspan="2">col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '<td>col3-3</td>',
          '<td>col3-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(11)

          const targetTexts = [
            'col1-1', 'col1-2', 'col1-3', 'col1-4',
            'col2-1', 'col2-2', 'col2-3',
            'col3-1', 'col3-2', 'col3-3', 'col3-4'
          ]

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 1 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 1 && cellIdx === 1) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at the end of middle row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td colspan="2">col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '<td>col3-3</td>',
          '<td>col3-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(11)

          const targetTexts = [
            'col1-1', 'col1-2', 'col1-3', 'col1-4',
            'col2-1', 'col2-2', 'col2-3',
            'col3-1', 'col3-2', 'col3-3', 'col3-4'
          ]

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 1 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 1 && cellIdx === 2) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set on the single cell first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td colspan="4">col1-1</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(5)

          const targetTexts = ['col1-1', 'col2-1', 'col2-2', 'col2-3', 'col2-4']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 1 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('4')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set on all cells of first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td colspan="2">col1-1</td>',
          '<td colspan="2">col1-2</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(6)

          const targetTexts = ['col1-1', 'col1-2', 'col2-1', 'col2-2', 'col2-3', 'col2-4']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 2 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && (cellIdx === 0 || cellIdx === 1)) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set continues to work with rows across thead, tbody`, async () => {
        const templateStr = [
          '<table>',
          '<thead>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="2">col1-3</td>',
          '</tr>',
          '</thead>',
          '<tbody>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '<td>col3-3</td>',
          '<td>col3-4</td>',
          '</tr>',
          '</tbody>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(11)

          const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col2-4', 'col3-1', 'col3-2', 'col3-3', 'col3-4']

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && cellIdx === 2) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td colspan set at but with empty cell on next row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td colspan="2">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td></td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', '']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))
          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 4)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 3 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && cellIdx === 2) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td negative rowspan set should default to as if there was no rowspan set`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td rowspan="-2">col1-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(3)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 3)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)

            should(vMergeNode).be.not.ok()

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set on single row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td rowspan="2">col1-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(3)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const idx = runIdx + 1
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            const rowIdx = Math.floor(runIdx / 3) + 1
            let cellIdx = idx % 3
            cellIdx = cellIdx === 0 ? 3 : cellIdx
            should(textNode.textContent).be.eql(`col${rowIdx}-${cellIdx}`)
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 3)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(1)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)

            should(vMergeNode).be.not.ok()

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set but not enough cells available (diff > 0)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td rowspan="3">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', '']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / 3)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)

            if (cellIdx === 2) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set at the start of first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="2">col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', '', 'col2-1', 'col2-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td decimal rowspan set should default to just integer part`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="2.9">col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', '', 'col2-1', 'col2-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      // NOTE: if we set rowspan to "0" for now we just make it count like we have rowspan="1"
      // however rowspan="0" is a special feature in some browsers,
      // so we may want to review in the future if we want to make it work
      // context:
      // - https://www.w3schools.com/tags/att_td_rowspan.asp
      // - https://stackoverflow.com/questions/34044438/why-may-not-the-colspan-attribute-be-set-to-zero
      it(`${mode} mode - <table> td rowspan set to 0 should default to as if there was no rowspan set`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="0">col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(targetTexts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            should(vMergeNode).be.not.ok()

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set in the middle of first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td rowspan="2">col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', '', 'col2-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 1) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set at the end of first row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td rowspan="2">col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', '']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 2) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set at the start of middle row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td rowspan="2">col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', '', 'col3-1', 'col3-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (rowIdx > 0 && cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 1 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set at the middle of middle row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td rowspan="2">col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col3-1', '', 'col3-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (rowIdx > 0 && cellIdx === 1) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 1 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set at the end of middle row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td rowspan="2">col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3', 'col3-1', 'col3-2', '']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (rowIdx > 0 && cellIdx === 2) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 1 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan should not work if it is from different group`, async () => {
        const templateStr = [
          '<table>',
          '<thead>',
          '<tr>',
          '<td>col1-1</td>',
          '<td>col1-2</td>',
          '<td rowspan="2">col1-3</td>',
          '</tr>',
          '</thead>',
          '<tbody>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '</tbody>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col2-1', 'col2-2', 'col2-3']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(targetTexts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            should(vMergeNode).be.not.ok()

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #1 (rowspan set on different rows making placeholders on the last row)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td rowspan="2">col2-1</td>',
          '<td rowspan="2">col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', '', 'col2-1', 'col2-2', 'col2-3', '', '', '', 'col3-1']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else if (rowIdx > 0 && cellIdx === 1) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 1 ? 'restart' : 'continue')
            } else if (rowIdx > 0 && cellIdx === 2) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 1 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #2 (rowspan set on first row with one cell, rows that fullfil the rowspan)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', '', 'col2-1', 'col2-2', '', 'col3-1', 'col3-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 1 : 3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #3 (rowspan set on first row with one cell, rows that fullfil the rowspan and more)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '</tr>',
          '<tr>',
          '<td>col4-1</td>',
          '<td>col4-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', '', 'col2-1', 'col2-2', '', 'col3-1', 'col3-2', 'col4-1', 'col4-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(4)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 3

          if (rowIdx === 0) {
            expectedCells = 1
          } else if (rowIdx === 3) {
            expectedCells = 2
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 0 && rowIdx !== 3) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #4 (rowspan set on first row with other cells on it, rows that fullfil the rowspan)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '<td>col3-2</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', '', 'col2-1', 'col2-2', '', 'col3-1', 'col3-2']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(3)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(3)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #5 (rowspan set on first row on all of its cells, rows that fullfil the rowspan)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '<td rowspan="3">col1-2</td>',
          '<td rowspan="3">col1-3</td>',
          '<td rowspan="3">col1-4</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', '', '', '', '', 'col2-1', '', '', '', '', 'col3-1']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(5)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx >= 1 ? 5 : 4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx >= 0 && cellIdx <= 3) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #6 (rowspan set on first row on all of its cells except last one, rows that fullfil the rowspan)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '<td rowspan="3">col1-2</td>',
          '<td rowspan="3">col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', '', '', '', 'col2-1', '', '', '', 'col3-1']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx >= 0 && cellIdx <= 2) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #7 (rowspan set on first row on all of its cells except last one which uses colspan, rows that fullfil the rowspan)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '<td rowspan="3">col1-2</td>',
          '<td rowspan="3">col1-3</td>',
          '<td colspan="3">col1-4</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td colspan="2">col2-2</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', '', '', '', 'col2-1', 'col2-2', '', '', '', 'col3-1']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(5)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 4

          if (rowIdx === 1) {
            expectedCells = 5
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            let cellWidth = colWidth

            if (cellIdx >= 0 && cellIdx <= 2) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            if (rowIdx === 0 && cellIdx === 3) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #8 (rowspan set on first row on all of its cells except last one which uses colspan, rows that fullfil the rowspan)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="2" colspan="2">corner</td>',
          '<td colspan="5">2015</td>',
          '<td colspan="5">2016</td>',
          '<td colspan="5">Summary</td>',
          '</tr>',
          '<tr>',
          '<td>Amount 1</td>',
          '<td>Amount 2</td>',
          '<td>Amount 3</td>',
          '<td>Amount 4</td>',
          '<td>Amount 5</td>',
          '<td>Amount 1</td>',
          '<td>Amount 2</td>',
          '<td>Amount 3</td>',
          '<td>Amount 4</td>',
          '<td>Amount 5</td>',
          '<td>Total Amount 1</td>',
          '<td>Total Amount 2</td>',
          '<td>Total Amount 3</td>',
          '<td>Total Amount 4</td>',
          '<td>Total Amount 5</td>',
          '</tr>',
          '<tr>',
          '<td rowspan="2">Buffer</td>',
          '<td>Jane Doe</td>',
          '<td>10</td>',
          '<td>15</td>',
          '<td>20</td>',
          '<td>25</td>',
          '<td>30</td>',
          '<td>2</td>',
          '<td>4</td>',
          '<td>6</td>',
          '<td>8</td>',
          '<td>10</td>',
          '<td>12</td>',
          '<td>19</td>',
          '<td>26</td>',
          '<td>32</td>',
          '<td>40</td>',
          '</tr>',
          '<tr>',
          '<td>Thomas Smith</td>',
          '<td>0</td>',
          '<td>25</td>',
          '<td>20</td>',
          '<td>15</td>',
          '<td>10</td>',
          '<td>5</td>',
          '<td>3</td>',
          '<td>6</td>',
          '<td>9</td>',
          '<td>12</td>',
          '<td>15</td>',
          '<td>5</td>',
          '<td>28</td>',
          '<td>26</td>',
          '<td>22</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = [
          'corner', '2015', '2016', 'Summary',
          '', 'Amount 1', 'Amount 2', 'Amount 3', 'Amount 4', 'Amount 5', 'Amount 1', 'Amount 2', 'Amount 3', 'Amount 4', 'Amount 5',
          'Total Amount 1', 'Total Amount 2', 'Total Amount 3', 'Total Amount 4', 'Total Amount 5',
          'Buffer', 'Jane Doe', '10', '15', '20', '25', '30', '2', '4', '6', '8', '10', '12', '19', '26', '32', '40',
          '', 'Thomas Smith', '0', '25', '20', '15', '10', '5', '3', '6', '9', '12', '15', '5', '28', '26', '22'
        ]

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(17)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[5].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[6].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[7].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[8].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[9].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[10].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[11].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[12].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[13].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[14].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[15].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[16].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(4)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 17

          if (rowIdx === 0) {
            expectedCells = 4
          } else if (rowIdx === 1) {
            expectedCells = 16
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            let cellWidth = colWidth

            if (cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 || rowIdx === 2 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            if ((rowIdx === 0 || rowIdx === 1) && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else if (rowIdx === 0 && (cellIdx === 1 || cellIdx === 2 || cellIdx === 3)) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('5')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #9 (using rowspan in different rows)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="3">col1-1</td>',
          '<td>col1-2</td>',
          '<td>col1-3</td>',
          '<td>col1-4</td>',
          '</tr>',
          '<tr>',
          '<td rowspan="2">col2-1</td>',
          '<td rowspan="2">col2-2</td>',
          '<td>col2-3</td>',
          '</tr>',
          '<tr>',
          '<td>col3-1</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['col1-1', 'col1-2', 'col1-3', 'col1-4', '', 'col2-1', 'col2-2', 'col2-3', '', '', '', 'col3-1']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(4)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(4)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 0) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else if (rowIdx >= 1 && (cellIdx === 1 || cellIdx === 2)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 1 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #10 (using rowspan and colspan in one row leaving a hole in cells for next row)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td colspan="10">project portfolio data</td>',
          '</tr>',
          '<tr>',
          '<td rowspan="2">project name</td>',
          '<td colspan="4">timeline</td>',
          '<td rowspan="2">number of team members</td>',
          '</tr>',
          '<tr>',
          '<td>calendar</td>',
          '<td>begin</td>',
          '<td>finish</td>',
          '<td># of days</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['project portfolio data', 'project name', 'timeline', 'number of team members', '', 'calendar', 'begin', 'finish', '# of days', '']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(6)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[5].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 6

          if (rowIdx === 0) {
            expectedCells = 1
          } else if (rowIdx === 1) {
            expectedCells = 3
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            let cellWidth = colWidth

            if (rowIdx >= 1 && (cellIdx === 0 || cellIdx === cellNodes.length - 1)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 1 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            if (rowIdx === 0 && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('6')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else if (rowIdx === 1 && cellIdx === 1) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('4')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #11 (using rowspan and colspan in one row leaving one set of holes in cells for next row and covering more cells than the available holes)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td colspan="10">project portfolio data</td>',
          '</tr>',
          '<tr>',
          '<td rowspan="2">project name</td>',
          '<td colspan="4">timeline</td>',
          '<td rowspan="2">number of team members</td>',
          '</tr>',
          '<tr>',
          '<td>calendar</td>',
          '<td>begin</td>',
          '<td>finish</td>',
          '<td># of days</td>',
          '<td>projected</td>',
          '<td>actual</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = ['project portfolio data', 'project name', 'timeline', 'number of team members', '', 'calendar', 'begin', 'finish', '# of days', '', 'projected', 'actual']

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(8)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[5].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[6].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[7].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 8

          if (rowIdx === 0) {
            expectedCells = 1
          } else if (rowIdx === 1) {
            expectedCells = 3
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            let cellWidth = colWidth

            if (rowIdx === 1 && (cellIdx === 0 || cellIdx === 2)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('restart')
            } else if (rowIdx === 2 && (cellIdx === 0 || cellIdx === 5)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            if (rowIdx === 0 && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('8')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else if (rowIdx === 1 && cellIdx === 1) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('4')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #12 (using two rowspan and colspan in one row leaving two sets of holes in cells for next row)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td colspan="10">project portfolio data</td>',
          '</tr>',
          '<tr>',
          '<td rowspan="2">project name</td>',
          '<td colspan="4">timeline</td>',
          '<td rowspan="2">number of team members</td>',
          '<td colspan="3">budget</td>',
          '<td colspan="3">risks</td>',
          '<td colspan="2">open</td>',
          '<td rowspan="2">pending actions</td>',
          '</tr>',
          '<tr>',
          '<td>calendar</td>',
          '<td>begin</td>',
          '<td>finish</td>',
          '<td># of days</td>',
          '<td>projected</td>',
          '<td>actual</td>',
          '<td>remainder</td>',
          '<td>high</td>',
          '<td>medium</td>',
          '<td>low</td>',
          '<td>issues</td>',
          '<td>revisions</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = [
          'project portfolio data', 'project name', 'timeline', 'number of team members', 'budget', 'risks', 'open', 'pending actions',
          '', 'calendar', 'begin', 'finish', '# of days', '', 'projected', 'actual', 'remainder', 'high', 'medium', 'low', 'issues', 'revisions', ''
        ]

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(15)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[5].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[6].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[7].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[8].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[9].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[10].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[11].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[12].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[13].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[14].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 15

          if (rowIdx === 0) {
            expectedCells = 1
          } else if (rowIdx === 1) {
            expectedCells = 7
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            let cellWidth = colWidth

            if (rowIdx === 1 && (cellIdx === 0 || cellIdx === 2 || cellIdx === 6)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('restart')
            } else if (rowIdx === 2 && (cellIdx === 0 || cellIdx === 5 || cellIdx === 14)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            if (rowIdx === 0 && cellIdx === 0) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('10')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else if (rowIdx === 1 && cellIdx === 1) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('4')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else if (rowIdx === 1 && (cellIdx === 3 || cellIdx === 4)) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('3')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else if (rowIdx === 1 && cellIdx === 5) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #13 (using multiple rowspan in one row and then continuing with cells in next row)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="2">date</td>',
          '<td rowspan="2">info1</td>',
          '<td colspan="2">group1</td>',
          '<td colspan="2">group2</td>',
          '<td rowspan="2">info8</td>',
          '<td rowspan="2">info9</td>',
          '<td rowspan="2">info10</td>',
          '<td rowspan="2">info11</td>',
          '</tr>',
          '<tr>',
          '<td>test1</td>',
          '<td>test2</td>',
          '<td>test3</td>',
          '<td>test4</td>',
          '</tr>',
          '<tr>',
          '<td>01022021</td>',
          '<td>i1</td>',
          '<td>g11</td>',
          '<td>g12</td>',
          '<td>g21</td>',
          '<td>g22</td>',
          '<td>i8</td>',
          '<td>i9</td>',
          '<td>i10</td>',
          '<td>i11</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = [
          'date', 'info1', 'group1', 'group2', 'info8', 'info9', 'info10', 'info11',
          '', '', 'test1', 'test2', 'test3', 'test4', '', '', '', '',
          '01022021', 'i1', 'g11', 'g12', 'g21', 'g22', 'i8', 'i9', 'i10', 'i11'
        ]

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(10)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[5].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[6].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[7].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[8].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[9].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 10

          if (rowIdx === 0) {
            expectedCells = 8
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            let cellWidth = colWidth

            if (rowIdx === 0 && (cellIdx === 0 || cellIdx === 1 || cellIdx === 4 || cellIdx === 5 || cellIdx === 6 || cellIdx === 7)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('restart')
            } else if (rowIdx === 1 && (cellIdx === 0 || cellIdx === 1 || cellIdx === 6 || cellIdx === 7 || cellIdx === 8 || cellIdx === 9)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            if (rowIdx === 0 && (cellIdx === 2 || cellIdx === 3)) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      it(`${mode} mode - <table> td rowspan layout #14 (using multiple rowspan and colspan in one row leaving holes in cells for next row)`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td rowspan="2">date</td>',
          '<td rowspan="2">info1</td>',
          '<td colspan="2">group1</td>',
          '<td colspan="2">group2</td>',
          '<td rowspan="2">info8</td>',
          '<td rowspan="2">info9</td>',
          '<td colspan="2">group3</td>',
          '<td rowspan="2">info11</td>',
          '</tr>',
          '<tr>',
          '<td>test1</td>',
          '<td>test2</td>',
          '<td>test3</td>',
          '<td>test4</td>',
          '<td>test5</td>',
          '<td>test6</td>',
          '</tr>',
          '<tr>',
          '<td>01022021</td>',
          '<td>i1</td>',
          '<td>g11</td>',
          '<td>g12</td>',
          '<td>g21</td>',
          '<td>g22</td>',
          '<td>i8</td>',
          '<td>i9</td>',
          '<td>g31</td>',
          '<td>g32</td>',
          '<td>i11</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = [
          'date', 'info1', 'group1', 'group2', 'info8', 'info9', 'group3', 'info11',
          '', '', 'test1', 'test2', 'test3', 'test4', '', '', 'test5', 'test6', '',
          '01022021', 'i1', 'g11', 'g12', 'g21', 'g22', 'i8', 'i9', 'g31', 'g32', 'i11'
        ]

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(11)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[5].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[6].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[7].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[8].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[9].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[10].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(3)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          let expectedCells = 11

          if (rowIdx === 0) {
            expectedCells = 8
          }

          should(cellNodes.length).be.eql(expectedCells)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            let cellWidth = colWidth

            if (rowIdx === 0 && (cellIdx === 0 || cellIdx === 1 || cellIdx === 4 || cellIdx === 5 || cellIdx === 7)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('restart')
            } else if (rowIdx === 1 && (cellIdx === 0 || cellIdx === 1 || cellIdx === 6 || cellIdx === 7 || cellIdx === 10)) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql('continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            if (rowIdx === 0 && (cellIdx === 2 || cellIdx === 3 || cellIdx === 6)) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              should(gridSpanNode).be.not.ok()
              cellWidth = colWidth
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })

      const origins = ['attribute', 'style']
      const units = ['px', 'cm', '%']

      for (const origin of origins) {
        if (mode !== 'block') {
          continue
        }

        for (const unit of units) {
          it(`${mode} mode - <table> ${origin} width="0${unit}" should be ignored`, async () => {
            const template = [
              `<table ${origin === 'attribute' ? `width="0${unit}"` : `style="width: 0${unit}"`}>`,
              generateRows(3, 1).join(''),
              '</table>'
            ].join('')

            const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

            const result = await reporter.render({
              template: {
                engine: 'handlebars',
                recipe: 'docx',
                docx: {
                  templateAsset: {
                    content: docxTemplateBuf
                  }
                }
              },
              data: {
                html: createHtml(template, [])
              }
            })

            // Write document for easier debugging
            fs.writeFileSync('out.docx', result.content)

            const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
            const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

            should(paragraphAtRootNodes.length).be.eql(0)

            const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

            should(tableAtRootNodes.length).be.eql(1)

            const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
            const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

            should(tblWNode.getAttribute('w:w')).be.eql('0')
            should(tblWNode.getAttribute('w:type')).be.eql('auto')

            const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
            const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

            should(gridColNodes.length).be.eql(3)

            const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

            should(rowNodes.length).be.eql(1)

            for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
              const rowNode = rowNodes[rowIdx]
              const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

              should(cellNodes.length).be.eql(3)

              for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                const cellNode = cellNodes[cellIdx]
                const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                should(paragraphNodes.length).be.eql(1)

                const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                should(runNodes.length).be.eql(1)

                const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                should(textNodes.length).be.eql(1)

                should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
              }
            }
          })

          it(`${mode} mode - <table> ${origin} width in ${unit}`, async () => {
            const getTableWidth = getValueForTest([{
              unit: 'px',
              value: '150px'
            }, {
              unit: 'cm',
              value: '6cm'
            }, {
              unit: '%',
              value: '50%'
            }])

            const tableWidth = getTableWidth(unit)

            const template = [
              `<table ${origin === 'attribute' ? `width="${tableWidth}"` : `style="width: ${tableWidth}"`}>`,
              generateRows(3, 1).join(''),
              '</table>'
            ].join('')

            const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

            const result = await reporter.render({
              template: {
                engine: 'handlebars',
                recipe: 'docx',
                docx: {
                  templateAsset: {
                    content: docxTemplateBuf
                  }
                }
              },
              data: {
                html: createHtml(template, [])
              }
            })

            // Write document for easier debugging
            fs.writeFileSync('out.docx', result.content)

            const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
            const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

            should(paragraphAtRootNodes.length).be.eql(0)

            const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

            should(tableAtRootNodes.length).be.eql(1)

            const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
            const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

            should(tblWNode.getAttribute('w:w')).be.eql(getValueInDXAForTest(tableWidth, unit, doc).toString())
            should(tblWNode.getAttribute('w:type')).be.eql('dxa')

            const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
            const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

            should(gridColNodes.length).be.eql(3)

            const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

            should(rowNodes.length).be.eql(1)

            for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
              const rowNode = rowNodes[rowIdx]
              const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

              should(cellNodes.length).be.eql(3)

              for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                const cellNode = cellNodes[cellIdx]
                const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                should(paragraphNodes.length).be.eql(1)

                const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                should(runNodes.length).be.eql(1)

                const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                should(textNodes.length).be.eql(1)

                should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
              }
            }
          })

          if (origin === 'style') {
            const tableModes = ['default', 'custom']

            for (const tableMode of tableModes) {
              it(`${mode} mode - <table> (${tableMode} width) single td ${origin} width (bigger than default col width) in ${unit}`, async () => {
                const getColWidth = getValueForTest([{
                  unit: 'px',
                  value: '250px'
                }, {
                  unit: 'cm',
                  value: '6cm'
                }, {
                  unit: '%',
                  value: '40%'
                }])

                const getRemainingColWidth = getValueForTest([{
                  unit: 'px',
                  value: tableMode === 'custom' ? 1875 : 2544
                }, {
                  unit: 'cm',
                  value: tableMode === 'custom' ? 2049 : 2718
                }, {
                  unit: '%',
                  value: tableMode === 'custom' ? 2250 : 2652
                }])

                const customTableWidth = 500
                const customTableWidthInDXA = getValueInDXAForTest(customTableWidth, 'px')
                const colWidth = getColWidth(unit)

                const template = [
                  `<table${tableMode === 'custom' ? ` width="${customTableWidth}"` : ''}>`,
                  '<tr>',
                  `<td style="width: ${colWidth}">col1-1</td>`,
                  '<td>col1-2</td>',
                  '<td>col1-3</td>',
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table$>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql(tableMode === 'custom' ? customTableWidthInDXA.toString() : '0')
                should(tblWNode.getAttribute('w:type')).be.eql(tableMode === 'custom' ? 'dxa' : 'auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                should(gridColNodes[0].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[1].getAttribute('w:w')).be.eql(getRemainingColWidth(unit).toString())
                should(gridColNodes[2].getAttribute('w:w')).be.eql(getRemainingColWidth(unit).toString())

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> (${tableMode} width) single td ${origin} width (smaller than default col width) in ${unit}`, async () => {
                const getColWidth = getValueForTest([{
                  unit: 'px',
                  value: '100px'
                }, {
                  unit: 'cm',
                  value: '3cm'
                }, {
                  unit: '%',
                  value: '20%'
                }])

                const getRemainingColWidth = getValueForTest([{
                  unit: 'px',
                  value: tableMode === 'custom' ? 3000 : 3669
                }, {
                  unit: 'cm',
                  value: tableMode === 'custom' ? 2900 : 3569
                }, {
                  unit: '%',
                  value: tableMode === 'custom' ? 3000 : 3535
                }])

                const customTableWidth = 500
                const customTableWidthInDXA = getValueInDXAForTest(customTableWidth, 'px')
                const colWidth = getColWidth(unit)

                const template = [
                  `<table${tableMode === 'custom' ? ` width="${customTableWidth}"` : ''}>`,
                  '<tr>',
                  `<td style="width: ${colWidth}">col1-1</td>`,
                  '<td>col1-2</td>',
                  '<td>col1-3</td>',
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql(tableMode === 'custom' ? customTableWidthInDXA.toString() : '0')
                should(tblWNode.getAttribute('w:type')).be.eql(tableMode === 'custom' ? 'dxa' : 'auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                should(gridColNodes[0].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[1].getAttribute('w:w')).be.eql(getRemainingColWidth(unit).toString())
                should(gridColNodes[2].getAttribute('w:w')).be.eql(getRemainingColWidth(unit).toString())

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> (${tableMode} width) multiple td ${origin} widths set greater than table width in ${unit}`, async () => {
                const getColWidth = getValueForTest([{
                  unit: 'px',
                  value: '400px'
                }, {
                  unit: 'cm',
                  value: '10cm'
                }, {
                  unit: '%',
                  value: '60%'
                }])

                const customTableWidth = 500
                const customTableWidthInDXA = getValueInDXAForTest(customTableWidth, 'px')
                const colWidth = getColWidth(unit)

                const template = [
                  `<table${tableMode === 'custom' ? ` width="${customTableWidth}"` : ''}>`,
                  '<tr>',
                  `<td style="width: ${colWidth}">col1-1</td>`,
                  `<td style="width: ${colWidth}">col1-2</td>`,
                  '<td>col1-3</td>',
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql(tableMode === 'custom' ? customTableWidthInDXA.toString() : '0')
                should(tblWNode.getAttribute('w:type')).be.eql(tableMode === 'custom' ? 'dxa' : 'auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                should(gridColNodes[0].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[1].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[2].getAttribute('w:w')).be.eql('1')

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> (${tableMode} width) multiple td ${origin} widths set lesser than table width in ${unit}`, async () => {
                const getColWidth = getValueForTest([{
                  unit: 'px',
                  value: '100px'
                }, {
                  unit: 'cm',
                  value: '2cm'
                }, {
                  unit: '%',
                  value: '20%'
                }])

                const getRemainingColWidth = getValueForTest([{
                  unit: 'px',
                  value: tableMode === 'custom' ? 4500 : 5838
                }, {
                  unit: 'cm',
                  value: tableMode === 'custom' ? 5232 : 6570
                }, {
                  unit: '%',
                  value: tableMode === 'custom' ? 4500 : 5302
                }])

                const customTableWidth = 500
                const customTableWidthInDXA = getValueInDXAForTest(customTableWidth, 'px')
                const colWidth = getColWidth(unit)

                const template = [
                  `<table${tableMode === 'custom' ? ` width="${customTableWidth}"` : ''}>`,
                  '<tr>',
                  `<td style="width: ${colWidth}">col1-1</td>`,
                  `<td style="width: ${colWidth}">col1-2</td>`,
                  '<td>col1-3</td>',
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql(tableMode === 'custom' ? customTableWidthInDXA.toString() : '0')
                should(tblWNode.getAttribute('w:type')).be.eql(tableMode === 'custom' ? 'dxa' : 'auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                should(gridColNodes[0].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[1].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[2].getAttribute('w:w')).be.eql(getRemainingColWidth(unit).toString())

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> (${tableMode} width) all td ${origin} widths set greater than table width in ${unit}`, async () => {
                const getColWidth = getValueForTest([{
                  unit: 'px',
                  value: '400px'
                }, {
                  unit: 'cm',
                  value: '10cm'
                }, {
                  unit: '%',
                  value: '60%'
                }])

                const customTableWidth = 500
                const customTableWidthInDXA = getValueInDXAForTest(customTableWidth, 'px')
                const colWidth = getColWidth(unit)

                const template = [
                  `<table${tableMode === 'custom' ? ` width="${customTableWidth}"` : ''}>`,
                  '<tr>',
                  `<td style="width: ${colWidth}">col1-1</td>`,
                  `<td style="width: ${colWidth}">col1-2</td>`,
                  `<td style="width: ${colWidth}">col1-3</td>`,
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql(tableMode === 'custom' ? customTableWidthInDXA.toString() : '0')
                should(tblWNode.getAttribute('w:type')).be.eql(tableMode === 'custom' ? 'dxa' : 'auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                should(gridColNodes[0].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[1].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[2].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> (${tableMode} width) all td ${origin} widths set lesser than available table width in ${unit}`, async () => {
                const getColWidth = getValueForTest([{
                  unit: 'px',
                  value: '100px'
                }, {
                  unit: 'cm',
                  value: '2cm'
                }, {
                  unit: '%',
                  value: '20%'
                }])

                const getTableWidth = getValueForTest([{
                  unit: 'px',
                  value: 4500
                }, {
                  unit: 'cm',
                  value: 3402
                }, {
                  unit: '%',
                  value: 5304
                }])

                const customTableWidth = 500
                const customTableWidthInDXA = getValueInDXAForTest(customTableWidth, 'px')
                const colWidth = getColWidth(unit)

                const template = [
                  `<table${tableMode === 'custom' ? ` width="${customTableWidth}"` : ''}>`,
                  '<tr>',
                  `<td style="width: ${colWidth}">col1-1</td>`,
                  `<td style="width: ${colWidth}">col1-2</td>`,
                  `<td style="width: ${colWidth}">col1-3</td>`,
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql(tableMode === 'custom' ? customTableWidthInDXA.toString() : getTableWidth(unit).toString())
                should(tblWNode.getAttribute('w:type')).be.eql('dxa')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                should(gridColNodes[0].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[1].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[2].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> (${tableMode} width td multiple width in ${unit} set on different rows but same col index`, async () => {
                const getColWidth = getValueForTest([{
                  unit: 'px',
                  value: '250px'
                }, {
                  unit: 'cm',
                  value: '6cm'
                }, {
                  unit: '%',
                  value: '40%'
                }])

                const getAlternativeColWidth = getValueForTest([{
                  unit: 'px',
                  value: '100px'
                }, {
                  unit: 'cm',
                  value: '3cm'
                }, {
                  unit: '%',
                  value: '20%'
                }])

                const getRemainingColWidth = getValueForTest([{
                  unit: 'px',
                  value: tableMode === 'custom' ? 1875 : 2544
                }, {
                  unit: 'cm',
                  value: tableMode === 'custom' ? 2049 : 2718
                }, {
                  unit: '%',
                  value: tableMode === 'custom' ? 2250 : 2652
                }])

                const customTableWidth = 500
                const customTableWidthInDXA = getValueInDXAForTest(customTableWidth, 'px')
                const colWidth = getColWidth(unit)
                const alternativeColWidth = getAlternativeColWidth(unit)

                const template = [
                  `<table${tableMode === 'custom' ? ` width="${customTableWidth}"` : ''}>`,
                  '<tr>',
                  `<td style="width: ${alternativeColWidth}">col1-1</td>`,
                  '<td>col1-2</td>',
                  '<td>col1-3</td>',
                  '</tr>',
                  '<tr>',
                  `<td style="width: ${colWidth}">col1-1</td>`,
                  '<td>col1-2</td>',
                  '<td>col1-3</td>',
                  '</tr>',
                  '<tr>',
                  `<td style="width: ${alternativeColWidth}">col1-1</td>`,
                  '<td>col1-2</td>',
                  '<td>col1-3</td>',
                  '</tr>',
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql(tableMode === 'custom' ? customTableWidthInDXA.toString() : '0')
                should(tblWNode.getAttribute('w:type')).be.eql(tableMode === 'custom' ? 'dxa' : 'auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                should(gridColNodes[0].getAttribute('w:w')).be.eql(getValueInDXAForTest(colWidth, unit, tableMode === 'custom' ? customTableWidthInDXA : doc).toString())
                should(gridColNodes[1].getAttribute('w:w')).be.eql(getRemainingColWidth(unit).toString())
                should(gridColNodes[2].getAttribute('w:w')).be.eql(getRemainingColWidth(unit).toString())

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(3)

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    should(textNodes[0].textContent).containEql('col')
                    should(textNodes[0].textContent).containEql('-')
                  }
                }
              })
            }

            if (unit !== '%') {
              it(`${mode} mode - <table> tr ${origin} height in ${unit}`, async () => {
                const getRowHeight = getValueForTest([{
                  unit: 'px',
                  value: '250px'
                }, {
                  unit: 'cm',
                  value: '6cm'
                }])

                const rowHeight = getRowHeight(unit)

                const template = [
                  '<table>',
                  `<tr style="height: ${rowHeight}">`,
                  '<td>col1-1</td>',
                  '<td>col1-2</td>',
                  '<td>col1-3</td>',
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql('0')
                should(tblWNode.getAttribute('w:type')).be.eql('auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                should(findChildNode('w:trHeight', findChildNode('w:trPr', rowNodes[0])).getAttribute('w:val')).be.eql(getValueInDXAForTest(rowHeight, unit).toString())

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> single td ${origin} height in ${unit}`, async () => {
                const getRowHeight = getValueForTest([{
                  unit: 'px',
                  value: '250px'
                }, {
                  unit: 'cm',
                  value: '6cm'
                }])

                const rowHeight = getRowHeight(unit)

                const template = [
                  '<table>',
                  '<tr>',
                  `<td style="height: ${rowHeight}">col1-1</td>`,
                  '<td>col1-2</td>',
                  '<td>col1-3</td>',
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql('0')
                should(tblWNode.getAttribute('w:type')).be.eql('auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                should(findChildNode('w:trHeight', findChildNode('w:trPr', rowNodes[0])).getAttribute('w:val')).be.eql(getValueInDXAForTest(rowHeight, unit).toString())

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> multiple td ${origin} heights set in ${unit}`, async () => {
                const getRowHeight = getValueForTest([{
                  unit: 'px',
                  value: '250px'
                }, {
                  unit: 'cm',
                  value: '6cm'
                }])

                const getAlternativeRowHeight = getValueForTest([{
                  unit: 'px',
                  value: '150px'
                }, {
                  unit: 'cm',
                  value: '4cm'
                }])

                const rowHeight = getRowHeight(unit)
                const alternativeRowHeight = getAlternativeRowHeight(unit)

                const template = [
                  '<table>',
                  '<tr>',
                  `<td style="height: ${alternativeRowHeight}">col1-1</td>`,
                  `<td style="height: ${rowHeight}">col1-2</td>`,
                  `<td style="height: ${alternativeRowHeight}">col1-3</td>`,
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql('0')
                should(tblWNode.getAttribute('w:type')).be.eql('auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                should(findChildNode('w:trHeight', findChildNode('w:trPr', rowNodes[0])).getAttribute('w:val')).be.eql(getValueInDXAForTest(rowHeight, unit).toString())

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })

              it(`${mode} mode - <table> both tr height and td ${origin} height set in ${unit} (the greater value wins)`, async () => {
                const getRowHeight = getValueForTest([{
                  unit: 'px',
                  value: '250px'
                }, {
                  unit: 'cm',
                  value: '6cm'
                }])

                const getAlternativeRowHeight = getValueForTest([{
                  unit: 'px',
                  value: '150px'
                }, {
                  unit: 'cm',
                  value: '4cm'
                }])

                const rowHeight = getRowHeight(unit)
                const alternativeRowHeight = getAlternativeRowHeight(unit)

                const template = [
                  '<table>',
                  `<tr style="height: ${alternativeRowHeight}">`,
                  '<td>col1-1</td>',
                  `<td style="height: ${rowHeight}">col1-2</td>`,
                  '<td>col1-3</td>',
                  '</tr>',
                  generateRows(3, 1).join(''),
                  '</table>'
                ].join('')

                const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-block.docx'))

                const result = await reporter.render({
                  template: {
                    engine: 'handlebars',
                    recipe: 'docx',
                    docx: {
                      templateAsset: {
                        content: docxTemplateBuf
                      }
                    }
                  },
                  data: {
                    html: createHtml(template, [])
                  }
                })

                // Write document for easier debugging
                fs.writeFileSync('out.docx', result.content)

                const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
                const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

                should(paragraphAtRootNodes.length).be.eql(0)

                const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

                should(tableAtRootNodes.length).be.eql(1)

                const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
                const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

                should(tblWNode.getAttribute('w:w')).be.eql('0')
                should(tblWNode.getAttribute('w:type')).be.eql('auto')

                const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
                const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

                should(gridColNodes.length).be.eql(3)

                const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

                should(rowNodes.length).be.eql(2)

                should(findChildNode('w:trHeight', findChildNode('w:trPr', rowNodes[0])).getAttribute('w:val')).be.eql(getValueInDXAForTest(rowHeight, unit).toString())

                for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
                  const rowNode = rowNodes[rowIdx]
                  const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

                  should(cellNodes.length).be.eql(3)

                  for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
                    const cellNode = cellNodes[cellIdx]
                    const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

                    should(paragraphNodes.length).be.eql(1)

                    const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

                    should(runNodes.length).be.eql(1)

                    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

                    should(textNodes.length).be.eql(1)

                    const targetRowIdx = rowIdx === 0 ? 0 : rowIdx - 1

                    should(textNodes[0].textContent).be.eql(`col${targetRowIdx + 1}-${cellIdx + 1}`)
                  }
                }
              })
            }
          }
        }
      }

      it(`${mode} mode - <table> td colspan set and custom cell width on same row`, async () => {
        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td colspan="2">col1-2</td>',
          '<td>col1-3</td>',
          '<td style="width: 150px">col1-4</td>',
          '<td>col1-5</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '<td>col2-5</td>',
          '<td>col2-6</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).be.eql(11)

          const targetTexts = [
            'col1-1', 'col1-2', 'col1-3', 'col1-4', 'col1-5',
            'col2-1', 'col2-2', 'col2-3', 'col2-4', 'col2-5', 'col2-6'
          ]

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(targetTexts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(6)

        const colWidth = 1318
        const customColWidth = getValueInDXAForTest('150px', 'px', doc)

        should(gridColNodes[0].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[1].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[2].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[3].getAttribute('w:w')).be.eql(colWidth.toString())
        should(gridColNodes[4].getAttribute('w:w')).be.eql(customColWidth.toString())
        should(gridColNodes[5].getAttribute('w:w')).be.eql(colWidth.toString())

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(rowIdx === 0 ? 5 : 6)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const gridSpanNode = findChildNode('w:gridSpan', tcPrNode)
            let cellWidth

            if (rowIdx === 0 && cellIdx === 1) {
              should(gridSpanNode).be.ok()
              should(gridSpanNode.getAttribute('w:val')).be.eql('2')
              cellWidth = colWidth * parseInt(gridSpanNode.getAttribute('w:val'), 10)
            } else {
              if (
                (rowIdx === 0 && cellIdx === 3) ||
                (rowIdx === 1 && cellIdx === 4)
              ) {
                cellWidth = customColWidth
              } else {
                cellWidth = colWidth
              }

              should(gridSpanNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(`col${rowIdx + 1}-${cellIdx + 1}`)
          }
        }
      })

      it(`${mode} mode - <table> td rowspan set and custom cell height on same row`, async () => {
        const targetHeight = '200px'

        const templateStr = [
          '<table>',
          '<tr>',
          '<td>col1-1</td>',
          '<td rowspan="2">col1-2</td>',
          '<td>col1-3</td>',
          `<td style="height: ${targetHeight}">col1-4</td>`,
          '<td>col1-5</td>',
          '</tr>',
          '<tr>',
          '<td>col2-1</td>',
          '<td>col2-2</td>',
          '<td>col2-3</td>',
          '<td>col2-4</td>',
          '</tr>',
          '</table>'
        ].join('')

        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateStr, [])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
        const paragraphAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:p')

        should(paragraphAtRootNodes.length).be.eql(mode === 'block' ? 0 : 1)

        const tableAtRootNodes = nodeListToArray(doc.getElementsByTagName('w:body')[0].childNodes).filter((el) => el.nodeName === 'w:tbl')

        should(tableAtRootNodes.length).be.eql(mode === 'block' ? 1 : 0)

        const targetTexts = [
          'col1-1', 'col1-2', 'col1-3', 'col1-4', 'col1-5',
          'col2-1', '', 'col2-2', 'col2-3', 'col2-4'
        ]

        if (mode !== 'block') {
          const runNodes = nodeListToArray(paragraphAtRootNodes[0].getElementsByTagName('w:r'))

          const texts = targetTexts.filter((t) => t !== '')

          should(runNodes.length).be.eql(texts.length)

          for (let runIdx = 0; runIdx < runNodes.length; runIdx++) {
            const runNode = runNodes[runIdx]
            const textNode = runNode.getElementsByTagName('w:t')[0]
            should(textNode.textContent).be.eql(texts[runIdx])
          }

          return
        }

        const tblPrNode = tableAtRootNodes[0].getElementsByTagName('w:tblPr')[0]
        const tblWNode = tblPrNode.getElementsByTagName('w:tblW')[0]

        should(tblWNode.getAttribute('w:w')).be.eql('0')
        should(tblWNode.getAttribute('w:type')).be.eql('auto')

        const tblGridNode = tableAtRootNodes[0].getElementsByTagName('w:tblGrid')[0]
        const gridColNodes = nodeListToArray(tblGridNode.getElementsByTagName('w:gridCol'))

        should(gridColNodes.length).be.eql(5)

        const tableWidth = getValueInDXAForTest('100%', '%', doc)
        const colWidth = Math.round(tableWidth / gridColNodes.length)

        const rowNodes = nodeListToArray(tableAtRootNodes[0].childNodes).filter((el) => el.nodeName === 'w:tr')

        should(rowNodes.length).be.eql(2)

        let targetTextIdx = -1

        for (let rowIdx = 0; rowIdx < rowNodes.length; rowIdx++) {
          const rowNode = rowNodes[rowIdx]
          const rowPrNode = findChildNode('w:trPr', rowNode)
          const trHeightNode = rowPrNode != null ? findChildNode('w:trHeight', rowPrNode) : null

          if (rowIdx === 0) {
            should(trHeightNode.getAttribute('w:val')).be.eql(getValueInDXAForTest(targetHeight, 'px').toString())
          } else {
            should(trHeightNode).be.not.ok()
          }

          const cellNodes = nodeListToArray(rowNode.childNodes).filter((el) => el.nodeName === 'w:tc')

          should(cellNodes.length).be.eql(5)

          for (let cellIdx = 0; cellIdx < cellNodes.length; cellIdx++) {
            const cellNode = cellNodes[cellIdx]
            const tcPrNode = findChildNode('w:tcPr', cellNode)
            const tcWNode = findChildNode('w:tcW', tcPrNode)
            const vMergeNode = findChildNode('w:vMerge', tcPrNode)
            const cellWidth = colWidth

            if (cellIdx === 1) {
              should(vMergeNode).be.ok()
              should(vMergeNode.getAttribute('w:val')).be.eql(rowIdx === 0 ? 'restart' : 'continue')
            } else {
              should(vMergeNode).be.not.ok()
            }

            should(tcWNode.getAttribute('w:type')).be.eql('dxa')
            should(tcWNode.getAttribute('w:w')).be.eql(cellWidth.toString())

            const paragraphNodes = nodeListToArray(cellNode.getElementsByTagName('w:p'))

            should(paragraphNodes.length).be.eql(1)

            const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

            should(runNodes.length).be.eql(1)

            targetTextIdx++

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).be.eql(1)

            should(textNodes[0].textContent).be.eql(targetTexts[targetTextIdx])
          }
        }
      })
    }
  })

  for (const listTag of ['ul', 'ol']) {
    describe(`<${listTag}>, <li> tag`, () => {
      const opts = {
        outputDocuments: ['word/styles.xml', 'word/numbering.xml'],
        getOpenCloseTags: () => [`<${listTag}><li>`, `</li></${listTag}>`],
        paragraphAssert: (paragraphNode, templateTextNodeForDocxHtml, extra) => {
          const mode = extra.mode

          if (mode === 'block') {
            const [stylesDoc, numberingDoc] = extra.outputDocuments
            const pPrNode = findChildNode('w:pPr', paragraphNode)
            const pStyleNode = findChildNode('w:pStyle', pPrNode)
            const listParagraphStyleId = pStyleNode.getAttribute('w:val')

            const listParagraphStyleNode = findChildNode((n) => (
              n.nodeName === 'w:style' &&
              n.getAttribute('w:type') === 'paragraph' &&
              n.getAttribute('w:styleId') === listParagraphStyleId
            ), stylesDoc.documentElement)

            should(listParagraphStyleNode).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:name' &&
              n.getAttribute('w:val') === 'List Paragraph'
            ), listParagraphStyleNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:basedOn' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), listParagraphStyleNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:uiPriority' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), listParagraphStyleNode)).be.ok()

            should(findChildNode('w:qFormat', listParagraphStyleNode)).be.ok()

            should(findChildNode('w:pPr', listParagraphStyleNode)).be.ok()

            const numPrNode = findChildNode('w:numPr', pPrNode)

            should(numPrNode).be.ok()

            const ilvlNode = findChildNode('w:ilvl', numPrNode)

            should(ilvlNode).be.ok()

            const ilvlVal = ilvlNode.getAttribute('w:val')

            should(parseInt(ilvlVal, 10)).be.not.NaN()

            const numIdNode = findChildNode('w:numId', numPrNode)

            should(numIdNode).be.ok()

            const numId = numIdNode.getAttribute('w:val')
            should(parseInt(numId, 10)).be.not.NaN()

            should(numberingDoc).be.ok()

            const numberingNumNode = findChildNode((n) => (
              n.nodeName === 'w:num' &&
              n.getAttribute('w:numId') === numId
            ), numberingDoc.documentElement)

            should(numberingNumNode).be.ok()

            const numberingAbstractNumIdNode = findChildNode('w:abstractNumId', numberingNumNode)

            should(numberingAbstractNumIdNode).be.ok()
            should(parseInt(numberingAbstractNumIdNode.getAttribute('w:val'), 10)).be.not.NaN()

            const abstractNumId = numberingAbstractNumIdNode.getAttribute('w:val')

            const numberingAbstractNumNode = findChildNode((n) => (
              n.nodeName === 'w:abstractNum' &&
              n.getAttribute('w:abstractNumId') === abstractNumId
            ), numberingDoc.documentElement)

            should(numberingAbstractNumNode).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:multiLevelType' &&
              n.getAttribute('w:val') === 'hybridMultilevel'
            ), numberingAbstractNumNode)).be.ok()

            const lvlNode = findChildNode((n) => (
              n.nodeName === 'w:lvl' &&
              n.getAttribute('w:ilvl') === ilvlVal
            ), numberingAbstractNumNode)

            should(lvlNode).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:start' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), lvlNode)).be.ok()

            const expectedFmt = listTag === 'ol' ? 'decimal' : 'bullet'

            should(findChildNode((n) => (
              n.nodeName === 'w:numFmt' &&
              n.getAttribute('w:val') === expectedFmt
            ), lvlNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:lvlText' &&
              n.getAttribute('w:val') != null &&
              n.getAttribute('w:val') !== ''
            ), lvlNode)).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:lvlJc' &&
              n.getAttribute('w:val') === 'left'
            ), lvlNode)).be.ok()

            should(findChildNode('w:pPr', lvlNode)).be.ok()

            if (listTag === 'ul') {
              should(findChildNode('w:rPr', lvlNode)).be.ok()
            }
          } else {
            commonHtmlParagraphAssertions(paragraphNode, templateTextNodeForDocxHtml.parentNode.parentNode)
          }
        }
      }

      runCommonTests(() => reporter, listTag, opts, commonWithText)
      runCommonTests(() => reporter, listTag, opts, commonWithInlineAndBlockSiblings)
      runCommonTests(() => reporter, listTag, opts, commonWithInlineBlockChildren)

      const outputDocuments = opts.outputDocuments
      const paragraphAssert = opts.paragraphAssert

      for (const mode of ['block', 'inline']) {
        const templateStr = `<${listTag}><li>...</li><li>...</li><li>...</li></${listTag}>`

        it(`${mode} mode - <${listTag}> with multiple items ${templateStr}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateStr, ['item1', 'item2', 'item3'])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

          const assertExtra = {
            mode,
            outputDocuments: restOfDocuments
          }

          const numberingDoc = restOfDocuments[1]

          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(mode === 'block' ? 3 : 1)

          if (mode === 'block') {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[2], templateTextNodesForDocxHtml[0], assertExtra)

            const numberingNumNodes = findChildNode((n) => (
              n.nodeName === 'w:num'
            ), numberingDoc.documentElement, true)

            should(numberingNumNodes.length).eql(1)

            const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodesInParagraph1.length).eql(1)
            should(textNodesInParagraph1[0].textContent).eql('item1')
            const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
            should(textNodesInParagraph2.length).eql(1)
            should(textNodesInParagraph2[0].textContent).eql('item2')
            const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
            should(textNodesInParagraph3.length).eql(1)
            should(textNodesInParagraph3[0].textContent).eql('item3')
          } else {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodes.length).eql(3)
            should(textNodes[0].textContent).eql('item1')
            should(textNodes[1].textContent).eql('item2')
            should(textNodes[2].textContent).eql('item3')
          }
        })

        const templateNestedStr = `<${listTag}><li>...</li><li>...<${listTag}><li>...</li><li>...</li></${listTag}></li><li>...</li></${listTag}>`

        it(`${mode} mode - <${listTag}> with nested same list ${templateNestedStr}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateNestedStr, ['item1', 'item2', 'nested item1', 'nested item2', 'item3'])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

          const assertExtra = {
            mode,
            outputDocuments: restOfDocuments
          }

          const numberingDoc = restOfDocuments[1]

          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(mode === 'block' ? 5 : 1)

          if (mode === 'block') {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[3], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[4], templateTextNodesForDocxHtml[0], assertExtra)

            const numberingNumNodes = findChildNode((n) => (
              n.nodeName === 'w:num'
            ), numberingDoc.documentElement, true)

            should(numberingNumNodes.length).eql(2)

            should(findChildNode((n) => (
              n.nodeName === 'w:ilvl' &&
              n.getAttribute('w:val') === '1'
            ), findChildNode('w:numPr', findChildNode('w:pPr', paragraphNodes[2])))).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:ilvl' &&
              n.getAttribute('w:val') === '1'
            ), findChildNode('w:numPr', findChildNode('w:pPr', paragraphNodes[3])))).be.ok()

            const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodesInParagraph1.length).eql(1)
            should(textNodesInParagraph1[0].textContent).eql('item1')
            const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
            should(textNodesInParagraph2.length).eql(1)
            should(textNodesInParagraph2[0].textContent).eql('item2')
            const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
            should(textNodesInParagraph3.length).eql(1)
            should(textNodesInParagraph3[0].textContent).eql('nested item1')
            const textNodesInParagraph4 = nodeListToArray(paragraphNodes[3].getElementsByTagName('w:t'))
            should(textNodesInParagraph4.length).eql(1)
            should(textNodesInParagraph4[0].textContent).eql('nested item2')
            const textNodesInParagraph5 = nodeListToArray(paragraphNodes[4].getElementsByTagName('w:t'))
            should(textNodesInParagraph5.length).eql(1)
            should(textNodesInParagraph5[0].textContent).eql('item3')
          } else {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodes.length).eql(5)
            should(textNodes[0].textContent).eql('item1')
            should(textNodes[1].textContent).eql('item2')
            should(textNodes[2].textContent).eql('nested item1')
            should(textNodes[3].textContent).eql('nested item2')
            should(textNodes[4].textContent).eql('item3')
          }
        })

        const templateNestedDifferentStr = `<${listTag}><li>...</li><li>...<${listTag === 'ol' ? 'ul' : 'ol'}><li>...</li><li>...</li></${listTag === 'ol' ? 'ul' : 'ol'}></li><li>...</li></${listTag}>`

        it(`${mode} mode - <${listTag}> with nested different list ${templateNestedDifferentStr}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateNestedDifferentStr, ['item1', 'item2', 'nested item1', 'nested item2', 'item3'])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

          const assertExtra = {
            mode,
            outputDocuments: restOfDocuments
          }

          const numberingDoc = restOfDocuments[1]

          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(mode === 'block' ? 5 : 1)

          if (mode === 'block') {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[4], templateTextNodesForDocxHtml[0], assertExtra)

            const numberingNumNodes = findChildNode((n) => (
              n.nodeName === 'w:num'
            ), numberingDoc.documentElement, true)

            should(numberingNumNodes.length).eql(2)

            const expectedFmt = listTag === 'ol' ? 'decimal' : 'bullet'

            const abstractNumIdNodeForN1 = findChildNode('w:abstractNumId', numberingNumNodes[0])

            const numFmtNodeForN1 = findChildNode('w:numFmt', findChildNode((n) => (
              n.nodeName === 'w:lvl' &&
              n.getAttribute('w:ilvl') === '0'
            ), findChildNode((n) => (
              n.nodeName === 'w:abstractNum' &&
              n.getAttribute('w:abstractNumId') === abstractNumIdNodeForN1.getAttribute('w:val')
            ), numberingDoc.documentElement)))

            should(numFmtNodeForN1).be.ok()
            should(numFmtNodeForN1.getAttribute('w:val')).eql(expectedFmt)

            const expectedFmt2 = listTag === 'ol' ? 'bullet' : 'decimal'

            const abstractNumIdNodeForN2 = findChildNode('w:abstractNumId', numberingNumNodes[1])

            const numFmtNodeForN2 = findChildNode('w:numFmt', findChildNode((n) => (
              n.nodeName === 'w:lvl' &&
              n.getAttribute('w:ilvl') === '0'
            ), findChildNode((n) => (
              n.nodeName === 'w:abstractNum' &&
              n.getAttribute('w:abstractNumId') === abstractNumIdNodeForN2.getAttribute('w:val')
            ), numberingDoc.documentElement)))

            should(numFmtNodeForN2).be.ok()
            should(numFmtNodeForN2.getAttribute('w:val')).eql(expectedFmt2)

            should(findChildNode((n) => (
              n.nodeName === 'w:ilvl' &&
              n.getAttribute('w:val') === '1'
            ), findChildNode('w:numPr', findChildNode('w:pPr', paragraphNodes[2])))).be.ok()

            should(findChildNode((n) => (
              n.nodeName === 'w:ilvl' &&
              n.getAttribute('w:val') === '1'
            ), findChildNode('w:numPr', findChildNode('w:pPr', paragraphNodes[3])))).be.ok()

            const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodesInParagraph1.length).eql(1)
            should(textNodesInParagraph1[0].textContent).eql('item1')
            const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
            should(textNodesInParagraph2.length).eql(1)
            should(textNodesInParagraph2[0].textContent).eql('item2')
            const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
            should(textNodesInParagraph3.length).eql(1)
            should(textNodesInParagraph3[0].textContent).eql('nested item1')
            const textNodesInParagraph4 = nodeListToArray(paragraphNodes[3].getElementsByTagName('w:t'))
            should(textNodesInParagraph4.length).eql(1)
            should(textNodesInParagraph4[0].textContent).eql('nested item2')
            const textNodesInParagraph5 = nodeListToArray(paragraphNodes[4].getElementsByTagName('w:t'))
            should(textNodesInParagraph5.length).eql(1)
            should(textNodesInParagraph5[0].textContent).eql('item3')
          } else {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodes.length).eql(5)
            should(textNodes[0].textContent).eql('item1')
            should(textNodes[1].textContent).eql('item2')
            should(textNodes[2].textContent).eql('nested item1')
            should(textNodes[3].textContent).eql('nested item2')
            should(textNodes[4].textContent).eql('item3')
          }
        })

        const templateTextChildStr = `<${listTag}>...<li>...</li><li>...</li></${listTag}>`

        it(`${mode} mode - <${listTag}> with text child directly in <${listTag}> ${templateTextChildStr}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateTextChildStr, ['text', 'item1', 'item2'])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

          const assertExtra = {
            mode,
            outputDocuments: restOfDocuments
          }

          const numberingDoc = restOfDocuments[1]

          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(mode === 'block' ? 3 : 1)

          if (mode === 'block') {
            commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
            paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[2], templateTextNodesForDocxHtml[0], assertExtra)

            const numberingNumNodes = findChildNode((n) => (
              n.nodeName === 'w:num'
            ), numberingDoc.documentElement, true)

            should(numberingNumNodes.length).eql(1)

            const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodesInParagraph1.length).eql(1)
            should(textNodesInParagraph1[0].textContent).eql('text')
            const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
            should(textNodesInParagraph2.length).eql(1)
            should(textNodesInParagraph2[0].textContent).eql('item1')
            const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
            should(textNodesInParagraph3.length).eql(1)
            should(textNodesInParagraph3[0].textContent).eql('item2')
          } else {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodes.length).eql(3)
            should(textNodes[0].textContent).eql('text')
            should(textNodes[1].textContent).eql('item1')
            should(textNodes[2].textContent).eql('item2')
          }
        })

        const templateSiblingAndMultipleItemsStr = `<${listTag}><li>...</li><li>...</li><li>...</li></${listTag}><${listTag}><li>...</li><li>...</li><li>...</li></${listTag}>`

        it(`${mode} mode - <${listTag}> with sibling list and multiple items <${listTag}> ${templateSiblingAndMultipleItemsStr}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateSiblingAndMultipleItemsStr, ['l1 item1', 'l1 item2', 'l1 item3', 'l2 item1', 'l2 item2', 'l2 item3'])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

          const assertExtra = {
            mode,
            outputDocuments: restOfDocuments
          }

          const numberingDoc = restOfDocuments[1]

          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(mode === 'block' ? 6 : 1)

          if (mode === 'block') {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[3], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[4], templateTextNodesForDocxHtml[0], assertExtra)
            paragraphAssert(paragraphNodes[5], templateTextNodesForDocxHtml[0], assertExtra)

            const numberingNumNodes = findChildNode((n) => (
              n.nodeName === 'w:num'
            ), numberingDoc.documentElement, true)

            should(numberingNumNodes.length).eql(2)

            const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodesInParagraph1.length).eql(1)
            should(textNodesInParagraph1[0].textContent).eql('l1 item1')
            const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
            should(textNodesInParagraph2.length).eql(1)
            should(textNodesInParagraph2[0].textContent).eql('l1 item2')
            const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
            should(textNodesInParagraph3.length).eql(1)
            should(textNodesInParagraph3[0].textContent).eql('l1 item3')
            const textNodesInParagraph4 = nodeListToArray(paragraphNodes[3].getElementsByTagName('w:t'))
            should(textNodesInParagraph4.length).eql(1)
            should(textNodesInParagraph4[0].textContent).eql('l2 item1')
            const textNodesInParagraph5 = nodeListToArray(paragraphNodes[4].getElementsByTagName('w:t'))
            should(textNodesInParagraph5.length).eql(1)
            should(textNodesInParagraph5[0].textContent).eql('l2 item2')
            const textNodesInParagraph6 = nodeListToArray(paragraphNodes[5].getElementsByTagName('w:t'))
            should(textNodesInParagraph6.length).eql(1)
            should(textNodesInParagraph6[0].textContent).eql('l2 item3')
          } else {
            paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
            should(textNodes.length).eql(6)
            should(textNodes[0].textContent).eql('l1 item1')
            should(textNodes[1].textContent).eql('l1 item2')
            should(textNodes[2].textContent).eql('l1 item3')
            should(textNodes[3].textContent).eql('l2 item1')
            should(textNodes[4].textContent).eql('l2 item2')
            should(textNodes[5].textContent).eql('l2 item3')
          }
        })
      }
    })
  }

  describe('white space handling in html input', () => {
    for (const mode of ['block', 'inline']) {
      const templateSpaceStr = '<p>      ...      ...     </p>'

      it(`${mode} mode - ignore space ${templateSpaceStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateSpaceStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(1)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateSpaceMultipleBlocksStr = '<div>  ...  </div>\n\n   <div>  ...  </div>\n'

      it(`${mode} mode - ignore space in multiple blocks ${templateSpaceMultipleBlocksStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateSpaceMultipleBlocksStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(mode === 'block' ? 2 : 1)

        if (mode === 'block') {
          const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodesInParagraph1.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph1[0].textContent).eql('Hello')
          const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
          should(textNodesInParagraph2.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph2[0].textContent).eql('World')
        } else {
          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodes.length).eql(2)
          commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodes[0].textContent).eql('Hello')
          should(textNodes[1].textContent).eql('World')
        }
      })

      const templateLineBreakStr = '\n<p>\n...</p>\n'

      it(`${mode} mode - ignore line break ${templateLineBreakStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateLineBreakStr, ['Hello'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(1)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello')
      })

      const templateSpaceTabLineBreakWithInlineStr = '<p>   ... \n\t\t\t\t<span> ...</span>\t  </p>'

      it(`${mode} mode - ignore space with inline element ${templateSpaceTabLineBreakWithInlineStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateSpaceTabLineBreakWithInlineStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(2)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello ')
        should(textNodes[1].textContent).eql('World')
      })

      const templateLeadingSpaceInlineStr = '... <span>...</span>'

      it(`${mode} mode - preserve leading space with text and inline element ${templateLeadingSpaceInlineStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateLeadingSpaceInlineStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(2)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello ')
        should(textNodes[1].textContent).eql('World')
      })

      const templateLeadingSpaceBlockStr = '... <p>...</p>'

      it(`${mode} mode - preserve leading space with text and block element ${templateLeadingSpaceBlockStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateLeadingSpaceBlockStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(mode === 'block' ? 2 : 1)

        if (mode === 'block') {
          const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodesInParagraph1.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph1[0].textContent).eql('Hello')
          const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
          should(textNodesInParagraph2.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph2[0].textContent).eql('World')
        } else {
          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodes.length).eql(2)
          commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodes[0].textContent).eql('Hello ')
          should(textNodes[1].textContent).eql('World')
        }
      })

      const templateTrailingSpaceInlineStr = '<span>...</span> ...'

      it(`${mode} mode - preserve trailing space with text and inline element ${templateTrailingSpaceInlineStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateTrailingSpaceInlineStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(2)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello')
        should(textNodes[1].textContent).eql(' World')
      })

      const templateTrailingSpaceBlockStr = '<p>...</p> ...'

      it(`${mode} mode - preserve trailing space with text and block element ${templateTrailingSpaceBlockStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateTrailingSpaceBlockStr, ['Hello', 'World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(mode === 'block' ? 2 : 1)

        if (mode === 'block') {
          const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodesInParagraph1.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph1[0].textContent).eql('Hello')
          const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
          should(textNodesInParagraph2.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph2[0].textContent).eql('World')
        } else {
          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodes.length).eql(2)
          commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodes[0].textContent).eql('Hello')
          should(textNodes[1].textContent).eql(' World')
        }
      })

      const templateLeadingTrailingSpaceInlineStr = '... <span>...</span> ...'

      it(`${mode} mode - preserve leading and trailing space with text and inline element ${templateLeadingTrailingSpaceInlineStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateLeadingTrailingSpaceInlineStr, ['Hello', 'World', 'Docx'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(3)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello ')
        should(textNodes[1].textContent).eql('World')
        should(textNodes[2].textContent).eql(' Docx')
      })

      const templateLeadingTrailingSpaceBlockStr = '... <p>...</p> ...'

      it(`${mode} mode - preserve leading and trailing space with text and block element ${templateLeadingTrailingSpaceBlockStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateLeadingTrailingSpaceBlockStr, ['Hello', 'World', 'Docx'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
        const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(mode === 'block' ? 3 : 1)

        if (mode === 'block') {
          const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodesInParagraph1.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph1[0].textContent).eql('Hello')
          const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
          should(textNodesInParagraph2.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph2[0].textContent).eql('World')
          const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
          should(textNodesInParagraph3.length).eql(1)
          commonHtmlTextAssertions(textNodesInParagraph3[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodesInParagraph3[0].textContent).eql('Docx')
        } else {
          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
          should(textNodes.length).eql(3)
          commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
          should(textNodes[0].textContent).eql('Hello ')
          should(textNodes[1].textContent).eql('World')
          should(textNodes[2].textContent).eql(' Docx')
        }
      })

      const templateTextWithSpaceInMiddleOfBlockStr = '<p><b>...</b>...<b>...</b></p>'

      it(`${mode} mode - preserve text with leading and trailing space in the middle of block element children ${templateTextWithSpaceInMiddleOfBlockStr}`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateTextWithSpaceInMiddleOfBlockStr, ['jsreport', ' is a ', 'javascript reporting server'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(3)
        should(textNodes[0].textContent).eql('jsreport')
        should(textNodes[1].textContent).eql(' is a ')
        should(textNodes[2].textContent).eql('javascript reporting server')
      })
    }
  })

  describe('styles', () => {
    for (const mode of ['block', 'inline']) {
      const templateFontSizeStr = '<p style="font-size: 32px">...</p>'

      it(`${mode} mode - font size`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateFontSizeStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:sz' &&
          n.getAttribute('w:val') != null && n.getAttribute('w:val') !== ''
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        findChildNode((n) => (
          n.nodeName === 'w:szCs' &&
          n.getAttribute('w:val') != null && n.getAttribute('w:val') !== ''
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateFontFamilyStr = '<p style="font-family: Tahoma">...</p>'

      it(`${mode} mode - font family`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateFontFamilyStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:rFonts' &&
          n.getAttribute('w:ascii') === 'Tahoma' &&
          n.getAttribute('w:hAnsi') === 'Tahoma'
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateFontFamily2Str = '<p style=\'font-family: "Times New Roman"\'>...</p>'

      it(`${mode} mode - font family with ""`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateFontFamily2Str, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:rFonts' &&
          n.getAttribute('w:ascii') === 'Times New Roman' &&
          n.getAttribute('w:hAnsi') === 'Times New Roman'
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateColorStr = '<p style="color: red">...</p>'

      it(`${mode} mode - color`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateColorStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:color' &&
          n.getAttribute('w:val') != null && n.getAttribute('w:val') !== ''
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateColor2Str = '<p style="color: #FF0000">...</p>'

      it(`${mode} mode - color #hex`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateColor2Str, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:color' &&
          n.getAttribute('w:val') != null && n.getAttribute('w:val') !== ''
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateBackgroundColorStr = '<p style="background-color: blue">...</p>'

      it(`${mode} mode - background color`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateBackgroundColorStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        if (mode === 'block') {
          findChildNode((n) => (
            n.nodeName === 'w:shd' &&
            n.getAttribute('w:fill') != null && n.getAttribute('w:fill') !== ''
          ), findChildNode('w:pPr', textNodes[0].parentNode.parentNode)).should.be.ok()
        }

        findChildNode((n) => (
          n.nodeName === 'w:shd' &&
          n.getAttribute('w:fill') != null && n.getAttribute('w:fill') !== ''
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateBackgroundColor2Str = '<p style="background-color: #0000FF">...</p>'

      it(`${mode} mode - background color #hex`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateBackgroundColor2Str, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        if (mode === 'block') {
          findChildNode((n) => (
            n.nodeName === 'w:shd' &&
            n.getAttribute('w:fill') != null && n.getAttribute('w:fill') !== ''
          ), findChildNode('w:pPr', textNodes[0].parentNode.parentNode)).should.be.ok()
        }

        findChildNode((n) => (
          n.nodeName === 'w:shd' &&
          n.getAttribute('w:fill') != null && n.getAttribute('w:fill') !== ''
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateTextDecorationUnderlineStr = '<p style="text-decoration: underline">...</p>'

      it(`${mode} mode - text decoration underline`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateTextDecorationUnderlineStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:u' &&
          n.getAttribute('w:val') === 'single'
        ), findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateTextDecorationLineThroughStr = '<p style="text-decoration: line-through">...</p>'

      it(`${mode} mode - text decoration line-through`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateTextDecorationLineThroughStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode('w:strike', findChildNode('w:rPr', textNodes[0].parentNode)).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      for (const textAlign of ['left', 'center', 'right', 'justify']) {
        const templateTextAlignStr = `<p style="text-align: ${textAlign}">...</p>`

        it(`${mode} mode - text align ${textAlign}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateTextAlignStr, ['Hello World'])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(1)

          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

          should(textNodes.length).eql(1)

          const targetVal = textAlign === 'justify' ? 'both' : textAlign

          if (mode === 'block') {
            findChildNode((n) => (
              n.nodeName = 'w:jc' &&
              n.getAttribute('w:val') === targetVal
            ), findChildNode('w:pPr', textNodes[0].parentNode.parentNode)).should.be.ok()
          }

          should(textNodes[0].textContent).eql('Hello World')
        })
      }

      for (const prop of ['padding', 'margin']) {
        for (const side of ['left', 'right', 'top', 'bottom']) {
          const templateStr = `<p style="padding-${side}: 50px">...</p>`

          it(`${mode} mode - ${prop} ${side}`, async () => {
            const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

            const result = await reporter.render({
              template: {
                engine: 'handlebars',
                recipe: 'docx',
                docx: {
                  templateAsset: {
                    content: docxTemplateBuf
                  }
                }
              },
              data: {
                html: createHtml(templateStr, ['Hello World'])
              }
            })

            // Write document for easier debugging
            fs.writeFileSync('out.docx', result.content)

            const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

            const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

            should(paragraphNodes.length).eql(1)

            const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

            should(textNodes.length).eql(1)

            const targetCases = {
              left: (n) => (
                n.nodeName = 'w:ind' &&
                n.getAttribute('w:left') != null && n.getAttribute('w:left') !== ''
              ),
              right: (n) => (
                n.nodeName = 'w:ind' &&
                n.getAttribute('w:right') != null && n.getAttribute('w:right') !== ''
              ),
              top: (n) => (
                n.nodeName = 'w:spacing' &&
                n.getAttribute('w:before') != null && n.getAttribute('w:before') !== ''
              ),
              bottom: (n) => (
                n.nodeName = 'w:spacing' &&
                n.getAttribute('w:after') != null && n.getAttribute('w:after') !== ''
              )
            }

            if (mode === 'block') {
              findChildNode(targetCases[side], findChildNode('w:pPr', textNodes[0].parentNode.parentNode)).should.be.ok()
            }

            should(textNodes[0].textContent).eql('Hello World')
          })
        }

        const templateShorthandStr = `<p style="${prop}: 50px">...</p>`

        it(`${mode} mode - ${prop} shorthand`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateShorthandStr, ['Hello World'])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(1)

          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

          should(textNodes.length).eql(1)

          if (mode === 'block') {
            findChildNode((n) => (
              n.nodeName = 'w:ind' &&
              n.getAttribute('w:left') != null && n.getAttribute('w:left') !== '' &&
              n.getAttribute('w:right') != null && n.getAttribute('w:right') !== ''
            ), findChildNode('w:pPr', textNodes[0].parentNode.parentNode)).should.be.ok()

            findChildNode((n) => (
              n.nodeName = 'w:spacing' &&
              n.getAttribute('w:before') != null && n.getAttribute('w:before') !== '' &&
              n.getAttribute('w:after') != null && n.getAttribute('w:after') !== ''
            ), findChildNode('w:pPr', textNodes[0].parentNode.parentNode)).should.be.ok()
          }

          should(textNodes[0].textContent).eql('Hello World')
        })
      }

      const templateBreakBeforePageStr = '<p style="break-before: page">...</p>'

      it(`${mode} mode - break before page`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateBreakBeforePageStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:br' &&
          n.getAttribute('w:type') === 'page'
        ), textNodes[0].parentNode.previousSibling).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })

      const templateBreakAfterPageStr = '<p style="break-after: page">...</p>'

      it(`${mode} mode - break after page`, async () => {
        const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

        const result = await reporter.render({
          template: {
            engine: 'handlebars',
            recipe: 'docx',
            docx: {
              templateAsset: {
                content: docxTemplateBuf
              }
            }
          },
          data: {
            html: createHtml(templateBreakAfterPageStr, ['Hello World'])
          }
        })

        // Write document for easier debugging
        fs.writeFileSync('out.docx', result.content)

        const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])

        const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

        should(paragraphNodes.length).eql(1)

        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

        should(textNodes.length).eql(1)

        findChildNode((n) => (
          n.nodeName === 'w:br' &&
          n.getAttribute('w:type') === 'page'
        ), textNodes[0].parentNode.nextSibling).should.be.ok()

        should(textNodes[0].textContent).eql('Hello World')
      })
    }
  })
})

describe('<img> tag', () => {
  let reporter

  beforeEach(() => {
    reporter = jsreport({
      store: {
        provider: 'memory'
      }
    })
      .use(require('../')())
      .use(require('@jsreport/jsreport-handlebars')())
      .use(require('@jsreport/jsreport-assets')())
      .use(jsreport.tests.listeners())
    return reporter.init()
  })

  afterEach(async () => {
    if (reporter) {
      await reporter.close()
    }
  })

  const imageBuf = fs.readFileSync(path.join(__dirname, 'image.png'))
  const imageDataSrc = 'data:image/png;base64,' + imageBuf.toString('base64')
  const imageDimensions = sizeOf(imageBuf)

  const targetImageSize = {
    width: pxToEMU(imageDimensions.width),
    height: pxToEMU(imageDimensions.height)
  }

  const image2Buf = fs.readFileSync(path.join(__dirname, 'image2.png'))
  const image2DataSrc = 'data:image/png;base64,' + image2Buf.toString('base64')
  const image2Dimensions = sizeOf(image2Buf)

  const targetImage2Size = {
    width: pxToEMU(image2Dimensions.width),
    height: pxToEMU(image2Dimensions.height)
  }

  for (const mode of ['block', 'inline']) {
    const templateEmptyStr = '<img />'

    it(`${mode} mode - <img> ${templateEmptyStr}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateEmptyStr, [])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(mode === 'block' ? 0 : 1)

      const outputImageSize = await getImageSize(result.content)

      should(outputImageSize).be.not.ok()
    })

    const templateStr = `<img src="${imageDataSrc}" />`

    it(`${mode} mode - <img> ${templateStr.slice(0, 35)}...`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateStr, [])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

      should(runNodes.length).eql(1)

      const outputImageSize = await getImageSize(result.content)

      // should preserve original image size by default
      outputImageSize.width.should.be.eql(targetImageSize.width)
      outputImageSize.height.should.be.eql(targetImageSize.height)

      const drawingEl = doc.getElementsByTagName('w:drawing')[0]
      const docPrEl = getDocPrEl(drawingEl)
      const pictureEl = getPictureElInfo(drawingEl).picture
      const pictureCnvPrEl = getPictureCnvPrEl(pictureEl)

      // should generate id when image is created from scratch
      docPrEl.getAttribute('id').should.be.eql('1')
      docPrEl.getAttribute('id').should.be.eql(pictureCnvPrEl.getAttribute('id'))

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(0)
    })

    const templateMultipleStr = `<img src="${imageDataSrc}" /><img src="${image2DataSrc}" />`

    it(`${mode} mode - <img> ${templateMultipleStr}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateMultipleStr, [])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

      should(runNodes.length).eql(2)

      const outputImageSizes = await getImageSize(result.content, null, true)
      const targetImageSizes = [targetImageSize, targetImage2Size]

      for (const [idx, outputImageSize] of outputImageSizes.entries()) {
        // should preserve original image size by default
        outputImageSize.width.should.be.eql(targetImageSizes[idx].width)
        outputImageSize.height.should.be.eql(targetImageSizes[idx].height)
      }

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(0)
    })

    const templateTextStr = `...<img src="${imageDataSrc}" />...`

    it(`${mode} mode - <img> ${templateTextStr}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateTextStr, ['Hello', 'World'])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

      should(runNodes.length).eql(3)

      const outputImageSize = await getImageSize(result.content)

      // should preserve original image size by default
      outputImageSize.width.should.be.eql(targetImageSize.width)
      outputImageSize.height.should.be.eql(targetImageSize.height)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(2)

      should(textNodes[0].textContent).eql('Hello')
      should(textNodes[1].textContent).eql('World')
    })

    const units = ['cm', 'px']

    for (const unit of units) {
      describe(`${mode} mode - <img> size in ${unit}`, () => {
        const targetSize = unit === 'cm' ? 3 : 100
        const targetSizeForWidth = unit === 'cm' ? 2 : 100
        const targetSizeForHeight = unit === 'cm' ? 2 : 50

        const templateCustomSizeStr = `<img src="${imageDataSrc}" style="width: ${targetSize}${unit}; height: ${targetSize}${unit}" />`

        it(`${mode} mode - <img> custom size (width, height) ${templateCustomSizeStr.slice(0, 35)}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const targetCustomImageSize = {
            width: unit === 'cm' ? cmToEMU(targetSize) : pxToEMU(targetSize),
            height: unit === 'cm' ? cmToEMU(targetSize) : pxToEMU(targetSize)
          }

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateCustomSizeStr, [])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(1)

          commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

          const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).eql(1)

          const outputImageSize = await getImageSize(result.content)

          outputImageSize.width.should.be.eql(targetCustomImageSize.width)
          outputImageSize.height.should.be.eql(targetCustomImageSize.height)

          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

          should(textNodes.length).eql(0)
        })

        const templateCustomWidthStr = `<img src="${imageDataSrc}" style="width: ${targetSizeForWidth}${unit}" />`

        it(`${mode} mode - <img> custom size (width set and height automatic - keep aspect ratio) ${templateCustomWidthStr.slice(0, 35)}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const targetCustomImageSize = {
            width: unit === 'cm' ? cmToEMU(targetSizeForWidth) : pxToEMU(targetSizeForWidth),
            // height is calculated automatically based on aspect ratio of image
            height: unit === 'cm' ? cmToEMU(0.5142851308524194) : pxToEMU(25.714330708661418)
          }

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateCustomWidthStr, [])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(1)

          commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

          const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).eql(1)

          const outputImageSize = await getImageSize(result.content)

          outputImageSize.width.should.be.eql(targetCustomImageSize.width)
          outputImageSize.height.should.be.eql(targetCustomImageSize.height)

          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

          should(textNodes.length).eql(0)
        })

        const templateCustomHeightStr = `<img src="${imageDataSrc}" style="height: ${targetSizeForHeight}${unit}" />`

        it(`${mode} mode - <img> custom size (height set and width automatic - keep aspect ratio) ${templateCustomHeightStr.slice(0, 35)}`, async () => {
          const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

          const targetCustomImageSize = {
            // width is calculated automatically based on aspect ratio of image
            width: unit === 'cm' ? cmToEMU(7.777781879962101) : pxToEMU(194.4444094488189),
            height: unit === 'cm' ? cmToEMU(targetSizeForHeight) : pxToEMU(targetSizeForHeight)
          }

          const result = await reporter.render({
            template: {
              engine: 'handlebars',
              recipe: 'docx',
              docx: {
                templateAsset: {
                  content: docxTemplateBuf
                }
              }
            },
            data: {
              html: createHtml(templateCustomHeightStr, [])
            }
          })

          // Write document for easier debugging
          fs.writeFileSync('out.docx', result.content)

          const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
          const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
          const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
          const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

          should(paragraphNodes.length).eql(1)

          commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

          const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

          should(runNodes.length).eql(1)

          const outputImageSize = await getImageSize(result.content)

          outputImageSize.width.should.be.eql(targetCustomImageSize.width)
          outputImageSize.height.should.be.eql(targetCustomImageSize.height)

          const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

          should(textNodes.length).eql(0)
        })
      })
    }

    const templateUrlStr = '<img src="https://some-server.com/some-image.png" />'

    it(`${mode} mode - <img> ${templateUrlStr}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      reporter.tests.beforeRenderEval((req, res, { require }) => {
        require('nock')('https://some-server.com')
          .get('/some-image.png')
          .replyWithFile(200, req.data.imagePath, {
            'content-type': 'image/png'
          })
      })

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateStr, []),
          imagePath: path.join(__dirname, 'image.png')
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

      should(runNodes.length).eql(1)

      const outputImageSize = await getImageSize(result.content)

      // should preserve original image size by default
      outputImageSize.width.should.be.eql(targetImageSize.width)
      outputImageSize.height.should.be.eql(targetImageSize.height)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(0)
    })

    const customAlt = 'custom alt set'
    const templateAltStr = `<img alt="${customAlt}" src="${imageDataSrc}" />`

    it(`${mode} mode - <img> ${templateAltStr.slice(0, 60)}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateAltStr, [])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

      should(runNodes.length).eql(1)

      const outputImageSize = await getImageSize(result.content)

      // should preserve original image size by default
      outputImageSize.width.should.be.eql(targetImageSize.width)
      outputImageSize.height.should.be.eql(targetImageSize.height)

      const pictureEl = await getImageEl(result.content)
      const pictureCNvPrEl = pictureEl.getElementsByTagName('pic:cNvPr')[0]

      should(pictureCNvPrEl.getAttribute('descr')).be.eql(customAlt)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(0)
    })

    const customLink = 'https://jsreport.net/'
    const templateLinkStr = `<a href="${customLink}"><img src="${imageDataSrc}"</a>`

    it(`${mode} mode - <img> ${templateLinkStr.slice(0, 50)}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await reporter.render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateLinkStr, [])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc, relsDoc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/_rels/document.xml.rels'])
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

      const runNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:r'))

      should(runNodes.length).eql(1)

      const outputImageSize = await getImageSize(result.content)

      // should preserve original image size by default
      outputImageSize.width.should.be.eql(targetImageSize.width)
      outputImageSize.height.should.be.eql(targetImageSize.height)

      const drawingEl = doc.getElementsByTagName('w:drawing')[0]
      const docPrEl = getDocPrEl(drawingEl)
      const pictureEl = getPictureElInfo(drawingEl).picture
      const pictureCnvPrEl = getPictureCnvPrEl(pictureEl)

      for (const srcEl of [docPrEl, pictureCnvPrEl]) {
        const aHlinkClickEl = nodeListToArray(srcEl.childNodes).find((el) => el.nodeName === 'a:hlinkClick')
        const aHLinkRelId = aHlinkClickEl.getAttribute('r:id')

        const aHLinkRelEl = nodeListToArray(relsDoc.documentElement.getElementsByTagName('Relationship')).find((el) => (
          el.getAttribute('Id') === aHLinkRelId &&
          el.getAttribute('Type') === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink' &&
          el.getAttribute('Target') === customLink &&
          el.getAttribute('TargetMode') === 'External'
        ))

        aHLinkRelEl.should.be.ok()
      }

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(0)
    })
  }
})

function commonWithText ({
  getReporter,
  tag,
  mode,
  parent,
  level,
  wrapWithLevel,
  createTagTemplate,
  IS_BLOCK_TAG,
  outputDocuments,
  paragraphAssert,
  textAssert
}) {
  repeatWithAlias(tag, (tag, alias) => {
    const templateStr = wrapWithLevel(createTagTemplate(tag, '...'))

    it(`${mode} mode - <${tag}>${alias} as ${level} ${templateStr}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await getReporter().render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateStr, ['Hello World'])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

      const assertExtra = {
        mode,
        outputDocuments: restOfDocuments
      }

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodes.length).eql(1)

      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello World')
    })
  })

  it(`${mode} mode - <${tag}> as ${level} preserve properties of element in template ${wrapWithLevel(createTagTemplate(tag, '...'))}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block-preserve-properties' : 'html-embed-inline-preserve-properties'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '...')), ['Hello World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)

    textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[0].textContent).eql('Hello World')
    should(findChildNode('w:b', findChildNode('w:rPr', textNodes[0].parentNode))).be.ok()
  })

  it(`${mode} mode - <${tag}> as ${level} and leading text sibling ${wrapWithLevel(`...${createTagTemplate(tag, '...')}`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

    if (IS_BLOCK_TAG && mode === 'block') {
      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} and trailing text sibling ${wrapWithLevel(`${createTagTemplate(tag, '...')}...`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`${createTagTemplate(tag, '...')}...`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

    if (IS_BLOCK_TAG && mode === 'block') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      commonHtmlParagraphAssertions(paragraphNodes[1], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      commonHtmlTextAssertions(textNodes[1], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[1].textContent).eql('World')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} with leading and trailing text siblings ${wrapWithLevel(`...${createTagTemplate(tag, '...')}...`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}...`), ['Hello', 'World', 'Docx'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 3 : 1)

    if (IS_BLOCK_TAG && mode === 'block') {
      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      commonHtmlParagraphAssertions(paragraphNodes[2], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
      const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
      should(textNodesInParagraph3.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph3[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodesInParagraph3[0].textContent).eql('Docx')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(3)
      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
      commonHtmlTextAssertions(textNodes[2], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[2].textContent).eql('Docx')
    }
  })

  if (mode === 'inline' && parent == null) {
    it(`${mode} mode - <${tag}> as ${level} with leading text in docx ${wrapWithLevel(createTagTemplate(tag, '...'))}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-inline-with-leading-text.docx'))

      const result = await getReporter().render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(wrapWithLevel(createTagTemplate(tag, '...')), ['Hello World'])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html inline=true}}')
      const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

      const assertExtra = {
        mode,
        outputDocuments: restOfDocuments
      }

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)

      const extractedDoc = await extractor.extract(result.content)
      extractedDoc.getBody().should.be.eql('Leading text Hello World\n')

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      const textNode = textNodes.find((t) => t.textContent === 'Hello World')

      textAssert(textNode, templateTextNodesForDocxHtml[0], assertExtra)
    })

    it(`${mode} mode - <${tag}> as ${level} with trailing text in docx ${wrapWithLevel(createTagTemplate(tag, '...'))}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-inline-with-trailing-text.docx'))

      const result = await getReporter().render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(wrapWithLevel(createTagTemplate(tag, '...')), ['Hello World'])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html inline=true}}')
      const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

      const assertExtra = {
        mode,
        outputDocuments: restOfDocuments
      }

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)

      const extractedDoc = await extractor.extract(result.content)
      extractedDoc.getBody().should.be.eql('Hello World Trailing text\n')

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      const textNode = textNodes.find((t) => t.textContent === 'Hello World')

      textAssert(textNode, templateTextNodesForDocxHtml[0], assertExtra)
    })

    it(`${mode} mode - <${tag}> as ${level} with leading and trailing text in docx ${wrapWithLevel(createTagTemplate(tag, '...'))}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, 'html-embed-inline-with-text.docx'))

      const result = await getReporter().render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(wrapWithLevel(createTagTemplate(tag, '...')), ['Hello World'])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, '{{docxHtml content=html inline=true}}')
      const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

      const assertExtra = {
        mode,
        outputDocuments: restOfDocuments
      }

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(1)

      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)

      const extractedDoc = await extractor.extract(result.content)
      extractedDoc.getBody().should.be.eql('Leading text Hello World and Trailing text\n')

      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      const textNode = textNodes.find((t) => t.textContent === 'Hello World')

      textAssert(textNode, templateTextNodesForDocxHtml[0], assertExtra)
    })
  }

  it(`${mode} mode - <${tag}> as ${level} in document header ${wrapWithLevel(`...${createTagTemplate(tag, '...')}`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block-header' : 'html-embed-inline-header'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World']),
        headerHtml: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc, header1TemplateDoc, header2TemplateDoc, header3TemplateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml'])
    const [doc, header1Doc, header2Doc, header3Doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const targetDocs = [{ doc, templateDoc }]

    const headerInfos = [
      { doc: header1Doc, templateDoc: header1TemplateDoc },
      { doc: header2Doc, templateDoc: header2TemplateDoc },
      { doc: header3Doc, templateDoc: header3TemplateDoc }
    ]

    for (const headerInfo of headerInfos) {
      if (headerInfo.doc == null) {
        continue
      }

      const paragraphNodes = nodeListToArray(headerInfo.doc.getElementsByTagName('w:p'))

      if (paragraphNodes.length === 0) {
        continue
      }

      const textNodesInFirstParagraph = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      if (textNodesInFirstParagraph.length === 0) {
        continue
      }

      targetDocs.push(headerInfo)
    }

    should(targetDocs.length).be.greaterThan(1)

    for (const [idx, { doc, templateDoc }] of targetDocs.entries()) {
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=${idx === 0 ? 'html' : 'headerHtml'}${mode === 'block' ? '' : ' inline=true'}}}`)
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

      if (IS_BLOCK_TAG && mode === 'block') {
        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodesInParagraph1.length).eql(1)
        commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        should(textNodesInParagraph1[0].textContent).eql('Hello')
        const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
        should(textNodesInParagraph2.length).eql(1)
        textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodesInParagraph2[0].textContent).eql('World')
      } else {
        paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(2)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello')
        textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodes[1].textContent).eql('World')
      }
    }
  })

  it(`${mode} mode - <${tag}> as ${level} in document footer ${wrapWithLevel(`...${createTagTemplate(tag, '...')}`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block-footer' : 'html-embed-inline-footer'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World']),
        footerHtml: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc, footer1TemplateDoc, footer2TemplateDoc, footer3TemplateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'])
    const [doc, footer1Doc, footer2Doc, footer3Doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const targetDocs = [{ doc, templateDoc }]

    const footerInfos = [
      { doc: footer1Doc, templateDoc: footer1TemplateDoc },
      { doc: footer2Doc, templateDoc: footer2TemplateDoc },
      { doc: footer3Doc, templateDoc: footer3TemplateDoc }
    ]

    for (const footerInfo of footerInfos) {
      if (footerInfo.doc == null) {
        continue
      }

      const paragraphNodes = nodeListToArray(footerInfo.doc.getElementsByTagName('w:p'))

      if (paragraphNodes.length === 0) {
        continue
      }

      const textNodesInFirstParagraph = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      if (textNodesInFirstParagraph.length === 0) {
        continue
      }

      targetDocs.push(footerInfo)
    }

    should(targetDocs.length).be.greaterThan(1)

    for (const [idx, { doc, templateDoc }] of targetDocs.entries()) {
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=${idx === 0 ? 'html' : 'footerHtml'}${mode === 'block' ? '' : ' inline=true'}}}`)
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

      if (IS_BLOCK_TAG && mode === 'block') {
        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodesInParagraph1.length).eql(1)
        commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        should(textNodesInParagraph1[0].textContent).eql('Hello')
        const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
        should(textNodesInParagraph2.length).eql(1)
        textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodesInParagraph2[0].textContent).eql('World')
      } else {
        paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(2)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello')
        textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodes[1].textContent).eql('World')
      }
    }
  })

  it(`${mode} mode - <${tag}> as ${level} in document header and footer ${wrapWithLevel(`...${createTagTemplate(tag, '...')}`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block-header-footer' : 'html-embed-inline-header-footer'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World']),
        headerHtml: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World']),
        footerHtml: createHtml(wrapWithLevel(`...${createTagTemplate(tag, '...')}`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc, header1TemplateDoc, header2TemplateDoc, header3TemplateDoc, footer1TemplateDoc, footer2TemplateDoc, footer3TemplateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'])
    const [doc, header1Doc, header2Doc, header3Doc, footer1Doc, footer2Doc, footer3Doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const targetDocs = [{ doc, templateDoc }]

    const headerFooterInfos = [
      { type: 'header', doc: header1Doc, templateDoc: header1TemplateDoc },
      { type: 'header', doc: header2Doc, templateDoc: header2TemplateDoc },
      { type: 'header', doc: header3Doc, templateDoc: header3TemplateDoc },
      { type: 'footer', doc: footer1Doc, templateDoc: footer1TemplateDoc },
      { type: 'footer', doc: footer2Doc, templateDoc: footer2TemplateDoc },
      { type: 'footer', doc: footer3Doc, templateDoc: footer3TemplateDoc }
    ]

    for (const headerFooterInfo of headerFooterInfos) {
      if (headerFooterInfo.doc == null) {
        continue
      }

      const paragraphNodes = nodeListToArray(headerFooterInfo.doc.getElementsByTagName('w:p'))

      if (paragraphNodes.length === 0) {
        continue
      }

      const textNodesInFirstParagraph = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      if (textNodesInFirstParagraph.length === 0) {
        continue
      }

      targetDocs.push(headerFooterInfo)
    }

    should(targetDocs.length).be.greaterThan(1)

    for (const [idx, { type, doc, templateDoc }] of targetDocs.entries()) {
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=${idx === 0 ? 'html' : `${type}Html`}${mode === 'block' ? '' : ' inline=true'}}}`)
      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

      if (IS_BLOCK_TAG && mode === 'block') {
        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodesInParagraph1.length).eql(1)
        commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        should(textNodesInParagraph1[0].textContent).eql('Hello')
        const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
        should(textNodesInParagraph2.length).eql(1)
        textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodesInParagraph2[0].textContent).eql('World')
      } else {
        paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(2)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello')
        textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodes[1].textContent).eql('World')
      }
    }
  })
}

function commonWithInlineAndBlockSiblings ({
  getReporter,
  tag,
  mode,
  level,
  wrapWithLevel,
  createTagTemplate,
  IS_BLOCK_TAG,
  outputDocuments,
  paragraphAssert,
  textAssert
}) {
  it(`${mode} mode - <${tag}> as ${level} and leading inline sibling ${wrapWithLevel(`<span>...</span>${createTagTemplate(tag, '...')}`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`<span>...</span>${createTagTemplate(tag, '...')}`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

    if (IS_BLOCK_TAG && mode === 'block') {
      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} and trailing inline sibling ${wrapWithLevel(`${createTagTemplate(tag, '...')}<span>...</span>`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`${createTagTemplate(tag, '...')}<span>...</span>`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

    if (IS_BLOCK_TAG && mode === 'block') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      commonHtmlParagraphAssertions(paragraphNodes[1], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      commonHtmlTextAssertions(textNodes[1], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[1].textContent).eql('World')
    }
  })

  repeatWithAlias(tag, (tag, alias) => {
    const templateStr = wrapWithLevel(`<span>...</span>${createTagTemplate(tag, '...')}<span>...</span>`)

    it(`${mode} mode - <${tag}>${alias} as ${level} with leading and trailing inline siblings ${templateStr}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await getReporter().render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(templateStr, ['Hello', 'World', 'Docx'])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

      const assertExtra = {
        mode,
        outputDocuments: restOfDocuments
      }

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 3 : 1)

      if (IS_BLOCK_TAG && mode === 'block') {
        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        commonHtmlParagraphAssertions(paragraphNodes[2], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodesInParagraph1.length).eql(1)
        commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodesInParagraph1[0].textContent).eql('Hello')
        const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
        should(textNodesInParagraph2.length).eql(1)
        textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodesInParagraph2[0].textContent).eql('World')
        const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
        should(textNodesInParagraph3.length).eql(1)
        commonHtmlTextAssertions(textNodesInParagraph3[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodesInParagraph3[0].textContent).eql('Docx')
      } else {
        paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(3)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello')
        textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodes[1].textContent).eql('World')
        commonHtmlTextAssertions(textNodes[2], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[2].textContent).eql('Docx')
      }
    })
  })

  it(`${mode} mode - <${tag}> as ${level} and leading block sibling ${wrapWithLevel(`<p>...</p>${createTagTemplate(tag, '...')}`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`<p>...</p>${createTagTemplate(tag, '...')}`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(mode === 'block' ? 2 : 1)

    if (mode === 'block') {
      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0].parentNode, assertExtra)
      should(textNodes[1].textContent).eql('World')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} and trailing block sibling ${wrapWithLevel(`${createTagTemplate(tag, '...')}<p>...</p>`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`${createTagTemplate(tag, '...')}<p>...</p>`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(mode === 'block' ? 2 : 1)

    if (mode === 'block') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      commonHtmlParagraphAssertions(paragraphNodes[1], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      commonHtmlTextAssertions(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      commonHtmlTextAssertions(textNodes[1], templateTextNodesForDocxHtml[0].parentNode)
      should(textNodes[1].textContent).eql('World')
    }
  })

  repeatWithAlias(tag, (tag, alias) => {
    it(`${mode} mode - <${tag}>${alias} as ${level} with leading and trailing block siblings ${wrapWithLevel(`<p>...</p>${createTagTemplate(tag, '...')}<p>...</p>`)}`, async () => {
      const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

      const result = await getReporter().render({
        template: {
          engine: 'handlebars',
          recipe: 'docx',
          docx: {
            templateAsset: {
              content: docxTemplateBuf
            }
          }
        },
        data: {
          html: createHtml(wrapWithLevel(`<p>...</p>${createTagTemplate(tag, '...')}<p>...</p>`), ['Hello', 'World', 'Docx'])
        }
      })

      // Write document for easier debugging
      fs.writeFileSync('out.docx', result.content)

      const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
      const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
      const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

      const assertExtra = {
        mode,
        outputDocuments: restOfDocuments
      }

      const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

      should(paragraphNodes.length).eql(mode === 'block' ? 3 : 1)

      if (mode === 'block') {
        commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        commonHtmlParagraphAssertions(paragraphNodes[2], templateTextNodesForDocxHtml[0].parentNode.parentNode)
        const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodesInParagraph1.length).eql(1)
        commonHtmlTextAssertions(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodesInParagraph1[0].textContent).eql('Hello')
        const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
        should(textNodesInParagraph2.length).eql(1)
        textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodesInParagraph2[0].textContent).eql('World')
        const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
        should(textNodesInParagraph3.length).eql(1)
        commonHtmlTextAssertions(textNodesInParagraph3[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodesInParagraph3[0].textContent).eql('Docx')
      } else {
        paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
        const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
        should(textNodes.length).eql(3)
        commonHtmlTextAssertions(textNodes[0], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[0].textContent).eql('Hello')
        textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
        should(textNodes[1].textContent).eql('World')
        commonHtmlTextAssertions(textNodes[2], templateTextNodesForDocxHtml[0].parentNode)
        should(textNodes[2].textContent).eql('Docx')
      }
    })
  })

  it(`${mode} mode - <${tag}> as ${level} with same as sibling ${wrapWithLevel(`${createTagTemplate(tag, '...')}${createTagTemplate(tag, '...')}`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(`${createTagTemplate(tag, '...')}${createTagTemplate(tag, '...')}`), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 2 : 1)

    if (IS_BLOCK_TAG && mode === 'block') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
    }
  })
}

function commonWithInlineBlockChildren ({
  getReporter,
  tag,
  mode,
  parent,
  level,
  wrapWithLevel,
  createTagTemplate,
  outputDocuments,
  paragraphAssert,
  textAssert
}) {
  it(`${mode} mode - <${tag}> as ${level} with leading inline child ${wrapWithLevel(createTagTemplate(tag, '<span>...</span>...'))}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<span>...</span>...')), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
    should(textNodes.length).eql(2)
    textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[0].textContent).eql('Hello')
    textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[1].textContent).eql('World')
  })

  it(`${mode} mode - <${tag}> as ${level} with trailing inline child ${wrapWithLevel(createTagTemplate(tag, '...<span>...</span>'))}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '...<span>...</span>')), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
    should(textNodes.length).eql(2)
    textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[0].textContent).eql('Hello')
    textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[1].textContent).eql('World')
  })

  it(`${mode} mode - <${tag}> as ${level} with leading and trailing inline children ${wrapWithLevel(createTagTemplate(tag, '<span>...</span>...<span>...</span>'))}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<span>...</span>...<span>...</span>')), ['Hello', 'World', 'Docx'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
    should(textNodes.length).eql(3)
    textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[0].textContent).eql('Hello')
    textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[1].textContent).eql('World')
    textAssert(textNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[2].textContent).eql('Docx')
  })

  it(`${mode} mode - <${tag}> as ${level} with inline children ${wrapWithLevel(createTagTemplate(tag, '<span>...</span><span>...</span><span>...</span>'))}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<span>...</span><span>...</span><span>...</span>')), ['Hello', 'World', 'Docx'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
    should(textNodes.length).eql(3)
    textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[0].textContent).eql('Hello')
    textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[1].textContent).eql('World')
    textAssert(textNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[2].textContent).eql('Docx')
  })

  it(`${mode} mode - <${tag}> as ${level} with inline nested child ${wrapWithLevel(createTagTemplate(tag, '<span><span>...</span></span>'))}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<span><span>...</span></span>')), ['Hello World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)

    textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[0].textContent).eql('Hello World')
  })

  it(`${mode} mode - <${tag}> as ${level} with leading block child ${wrapWithLevel(createTagTemplate(tag, '<p>...</p>...'), parent === 'block' ? 'div' : null)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<p>...</p>...'), parent === 'block' ? 'div' : null), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(mode === 'block' ? 2 : 1)

    if (mode === 'block') {
      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} with trailing block child ${wrapWithLevel(createTagTemplate(tag, '...<p>...</p>'), parent === 'block' ? 'div' : null)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '...<p>...</p>'), parent === 'block' ? 'div' : null), ['Hello', 'World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(mode === 'block' ? 2 : 1)

    if (mode === 'block') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      commonHtmlParagraphAssertions(paragraphNodes[1], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(2)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} with leading and trailing block children ${wrapWithLevel(createTagTemplate(tag, '<p>...</p>...<p>...</p>'), parent === 'block' ? 'div' : null)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<p>...</p>...<p>...</p>'), parent === 'block' ? 'div' : null), ['Hello', 'World', 'Docx'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(mode === 'inline' ? 1 : 3)

    if (mode === 'inline') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(3)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
      textAssert(textNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[2].textContent).eql('Docx')
    } else {
      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      commonHtmlParagraphAssertions(paragraphNodes[2], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
      const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
      should(textNodesInParagraph3.length).eql(1)
      textAssert(textNodesInParagraph3[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph3[0].textContent).eql('Docx')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} with block children ${wrapWithLevel(createTagTemplate(tag, '<p>...</p><p>...</p><p>...</p>'), parent === 'block' ? 'div' : null)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<p>...</p><p>...</p><p>...</p>'), parent === 'block' ? 'div' : null), ['Hello', 'World', 'Docx'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(mode === 'inline' ? 1 : 3)

    if (mode === 'inline') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(3)
      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')
      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')
      textAssert(textNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[2].textContent).eql('Docx')
    } else {
      commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      commonHtmlParagraphAssertions(paragraphNodes[1], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      commonHtmlParagraphAssertions(paragraphNodes[2], templateTextNodesForDocxHtml[0].parentNode.parentNode)
      const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodesInParagraph1.length).eql(1)
      textAssert(textNodesInParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph1[0].textContent).eql('Hello')
      const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))
      should(textNodesInParagraph2.length).eql(1)
      textAssert(textNodesInParagraph2[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph2[0].textContent).eql('World')
      const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))
      should(textNodesInParagraph3.length).eql(1)
      textAssert(textNodesInParagraph3[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodesInParagraph3[0].textContent).eql('Docx')
    }
  })

  it(`${mode} mode - <${tag}> as ${level} with block nested child ${wrapWithLevel(createTagTemplate(tag, '<div><div>...</div></div>'), parent === 'block' ? 'div' : null)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: createHtml(wrapWithLevel(createTagTemplate(tag, '<div><div>...</div></div>'), parent === 'block' ? 'div' : null), ['Hello World'])
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    commonHtmlParagraphAssertions(paragraphNodes[0], templateTextNodesForDocxHtml[0].parentNode.parentNode)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)

    textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
    should(textNodes[0].textContent).eql('Hello World')
  })
}

function commonWithSameNestedChildren ({
  getReporter,
  tag,
  mode,
  parent,
  level,
  wrapWithLevel,
  IS_BLOCK_TAG,
  outputDocuments,
  paragraphAssert,
  textAssert
}) {
  // we only want to run it for the root level
  if (parent != null) {
    return
  }

  it(`${mode} mode - <${tag}> as ${level} with same nested children ${wrapWithLevel(`<${tag}>...<${tag}>...<${tag}>...<${tag}>...</$${tag}><${tag}>...</${tag}>...</${tag}>...</${tag}>...</${tag}>`)}`, async () => {
    const docxTemplateBuf = fs.readFileSync(path.join(__dirname, `${mode === 'block' ? 'html-embed-block' : 'html-embed-inline'}.docx`))

    const result = await getReporter().render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: docxTemplateBuf
          }
        }
      },
      data: {
        html: wrapWithLevel(`<${tag}>Hello<${tag}>World<${tag}>from<${tag}>another</${tag}><${tag}>element</${tag}>nested</${tag}>of text</${tag}>in docx</${tag}>`)
      }
    })

    // Write document for easier debugging
    fs.writeFileSync('out.docx', result.content)

    const [templateDoc] = await getDocumentsFromDocxBuf(docxTemplateBuf, ['word/document.xml'])
    const templateTextNodesForDocxHtml = getTextNodesMatching(templateDoc, `{{docxHtml content=html${mode === 'block' ? '' : ' inline=true'}}}`)
    const [doc, ...restOfDocuments] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', ...outputDocuments])

    const assertExtra = {
      mode,
      outputDocuments: restOfDocuments
    }

    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(IS_BLOCK_TAG && mode === 'block' ? 8 : 1)

    if (IS_BLOCK_TAG && mode === 'block') {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[3], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[4], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[5], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[6], templateTextNodesForDocxHtml[0], assertExtra)
      paragraphAssert(paragraphNodes[7], templateTextNodesForDocxHtml[0], assertExtra)

      const textNodesParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

      should(textNodesParagraph1.length).eql(1)

      textAssert(textNodesParagraph1[0], templateTextNodesForDocxHtml[0], assertExtra)

      should(textNodesParagraph1[0].textContent).eql('Hello')

      const textNodesParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))

      should(textNodesParagraph2.length).eql(1)

      textAssert(textNodesParagraph2[0], templateTextNodesForDocxHtml[0])

      should(textNodesParagraph2[0].textContent).eql('World', assertExtra)

      const textNodesParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))

      should(textNodesParagraph3.length).eql(1)

      textAssert(textNodesParagraph3[0], templateTextNodesForDocxHtml[0], assertExtra)

      should(textNodesParagraph3[0].textContent).eql('from')

      const textNodesParagraph4 = nodeListToArray(paragraphNodes[3].getElementsByTagName('w:t'))

      should(textNodesParagraph4.length).eql(1)

      textAssert(textNodesParagraph4[0], templateTextNodesForDocxHtml[0], assertExtra)

      should(textNodesParagraph4[0].textContent).eql('another')

      const textNodesParagraph5 = nodeListToArray(paragraphNodes[4].getElementsByTagName('w:t'))

      should(textNodesParagraph5.length).eql(1)

      textAssert(textNodesParagraph5[0], templateTextNodesForDocxHtml[0], assertExtra)

      should(textNodesParagraph5[0].textContent).eql('element')

      const textNodesParagraph6 = nodeListToArray(paragraphNodes[5].getElementsByTagName('w:t'))

      should(textNodesParagraph6.length).eql(1)

      textAssert(textNodesParagraph6[0], templateTextNodesForDocxHtml[0], assertExtra)

      should(textNodesParagraph6[0].textContent).eql('nested')

      const textNodesParagraph7 = nodeListToArray(paragraphNodes[6].getElementsByTagName('w:t'))

      should(textNodesParagraph7.length).eql(1)

      textAssert(textNodesParagraph7[0], templateTextNodesForDocxHtml[0], assertExtra)

      should(textNodesParagraph7[0].textContent).eql('of text')

      const textNodesParagraph8 = nodeListToArray(paragraphNodes[7].getElementsByTagName('w:t'))

      should(textNodesParagraph8.length).eql(1)

      textAssert(textNodesParagraph8[0], templateTextNodesForDocxHtml[0], assertExtra)

      should(textNodesParagraph8[0].textContent).eql('in docx')
    } else {
      paragraphAssert(paragraphNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))
      should(textNodes.length).eql(8)

      textAssert(textNodes[0], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[0].textContent).eql('Hello')

      textAssert(textNodes[1], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[1].textContent).eql('World')

      textAssert(textNodes[2], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[2].textContent).eql('from')

      textAssert(textNodes[3], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[3].textContent).eql('another')

      textAssert(textNodes[4], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[4].textContent).eql('element')

      textAssert(textNodes[5], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[5].textContent).eql('nested')

      textAssert(textNodes[6], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[6].textContent).eql('of text')

      textAssert(textNodes[7], templateTextNodesForDocxHtml[0], assertExtra)
      should(textNodes[7].textContent).eql('in docx')
    }
  })
}

function runCommonTests (getReporter, tag, options = {}, testsSuiteFn) {
  if (!SUPPORTED_ELEMENTS.includes(tag)) {
    throw new Error(`${tag} is not supported`)
  }

  const ELEMENT = ELEMENTS.find((el) => el.tag === tag)
  const IS_BLOCK_TAG = BLOCK_ELEMENTS.includes(tag)
  const outputDocuments = options.outputDocuments || []
  const getOpenCloseTags = options.getOpenCloseTags || ((tag) => [`<${tag}>`, `</${tag}>`])
  // paragraphAssert, textAssert will be called for the nodes that are
  // containing the html tag evaluated and that are expected to contain the modified changes
  const paragraphAssert = options.paragraphAssert || (() => {})
  const textAssert = options.textAssert || (() => {})
  const targetMode = options.targetMode || ['block', 'inline']
  const targetParent = options.targetParent || [null, 'inline', 'block']

  for (const mode of targetMode) {
    for (const parent of targetParent) {
      const level = `${parent == null ? 'root' : `child of ${parent}`}`
      const customWrapWithLevel = (...args) => wrapWithLevel(parent, ...args)

      const createTagTemplate = (tag, content) => {
        const [open, close] = getOpenCloseTags(tag)
        return [open, content, close].join('')
      }

      testsSuiteFn({
        getReporter,
        tag,
        mode,
        parent,
        level,
        wrapWithLevel: customWrapWithLevel,
        createTagTemplate,
        ELEMENT,
        IS_BLOCK_TAG,
        outputDocuments,
        paragraphAssert,
        textAssert
      })
    }
  }
}

function commonHtmlParagraphAssertions (pNode, templatePNode) {
  const templatePPropertiesEl = nodeListToArray(templatePNode.childNodes).find((n) => n.nodeName === 'w:pPr')
  const pPropertiesEl = nodeListToArray(pNode.childNodes).find((n) => n.nodeName === 'w:pPr')

  if (templatePPropertiesEl != null && pPropertiesEl != null) {
    // assert that we inherit paragraph properties
    should(templatePPropertiesEl.toString()).be.eql(pPropertiesEl.toString())
  }
}

function commonHtmlTextAssertions (tNode, templateRNode) {
  const templateRPropertiesEl = nodeListToArray(templateRNode.childNodes).find((n) => n.nodeName === 'w:rPr')
  const rPropertiesEl = nodeListToArray(tNode.parentNode.childNodes).find((n) => n.nodeName === 'w:rPr')

  if (templateRPropertiesEl != null && rPropertiesEl != null) {
    // assert that we inherit run properties
    should(templateRPropertiesEl.toString()).be.eql(rPropertiesEl.toString())
  }

  // assert that we mark the xml text node as space preserve to be able to handle leading/trailing spaces
  should(tNode.getAttribute('xml:space')).be.eql('preserve')
}

function repeatWithAlias (tag, testFn) {
  const ELEMENT = ELEMENTS.find((el) => el.tag === tag)
  const withAliasTargets = [tag]

  if (ELEMENT.alias != null) {
    withAliasTargets.push(...ELEMENT.alias)
  }

  for (const currentTag of withAliasTargets) {
    const alias = `${ELEMENT.alias?.includes(currentTag) ? ` (alias of <${ELEMENT.tag}>)` : ''}`
    testFn(currentTag, alias)
  }
}

function wrapWithLevel (parent, html, customTag) {
  if (parent == null) {
    return html
  }

  let parentTag

  if (parent === 'inline') {
    parentTag = 'span'
  } else if (parent === 'block') {
    parentTag = 'p'
  }

  if (customTag != null) {
    parentTag = customTag
  }

  if (parentTag == null) {
    throw new Error(`Invalid parent "${parent}"`)
  }

  const newHtml = `<${parentTag}>${html}</${parentTag}>`

  return newHtml
}

function createHtml (templateStr, words) {
  let nextWordIdx = 0
  const wordRegExp = /\.\.\./g

  return templateStr.replace(wordRegExp, () => {
    const result = words[nextWordIdx]

    if (result == null) {
      throw new Error(`There is no word at ${nextWordIdx} index, pass more items to the array of words`)
    }

    nextWordIdx++

    return result
  })
}
