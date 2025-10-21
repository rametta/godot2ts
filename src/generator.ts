import typescript from 'typescript'

export function generate() {
  return typescript.factory.createJSDocAllType()
}