/**
 * Utility to add a representation to a structure from saved session data.
 *
 * @param plugin The Mol* plugin instance.
 * @param structureRef The structure reference to add the representation to.
 * @param rep The saved representation info (from getStructureRepresentations).
 * @returns A promise that resolves when the representation is added.
 */
export async function addRepresentationFromSession(plugin: any, structureRef: string, rep: any) {
  // Use Mol* builder API to add a representation
  const { type, params, colorTheme } = rep;
  // You may want to map type and params to your app's representation API
  // This is a stub: you must adapt to your addRepresentation logic
  // Find the structure component by ref
  const structureComponent = plugin.state.data.cells.get(structureRef);
  if (!structureComponent) throw new Error('Structure component not found');
  // Add the representation using the builder
  await plugin.builders.structure.representation.addRepresentation(
    structureRef,
    {
      type: params?.values?.type?.name || type,
      colorTheme: colorTheme || params?.values?.colorTheme,
      // ...spread other params as needed
    }
  );
}
