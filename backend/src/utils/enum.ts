export function isValidEnumValue<T extends readonly string[]>(
    list: T,
    value: any
): value is T[number] {
    return list.includes(value)
}