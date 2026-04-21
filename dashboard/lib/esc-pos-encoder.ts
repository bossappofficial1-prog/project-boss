export class EscPosEncoder {
    private buffer: number[] = [];

    constructor() {
        this.initialize();
    }

    // Command to initialize printer
    public initialize(): this {
        this.buffer.push(0x1B, 0x40);
        return this;
    }

    // Utility to stringify text
    public text(str: string): this {
        for (let i = 0; i < str.length; i++) {
            this.buffer.push(str.charCodeAt(i));
        }
        return this;
    }

    // New Line
    public newline(): this {
        this.buffer.push(0x0A);
        return this;
    }

    public feed(lines: number = 3): this {
        this.buffer.push(0x1B, 0x64, lines);
        return this;
    }

    public cut(): this {
        // partial cut
        this.buffer.push(0x1D, 0x56, 0x41, 0x00);
        return this;
    }

    public alignCenter(): this {
        this.buffer.push(0x1B, 0x61, 0x01);
        return this;
    }

    public alignLeft(): this {
        this.buffer.push(0x1B, 0x61, 0x00);
        return this;
    }

    public alignRight(): this {
        this.buffer.push(0x1B, 0x61, 0x02);
        return this;
    }
    
    // Set bold text
    public bold(enabled: boolean): this {
        this.buffer.push(0x1B, 0x45, enabled ? 1 : 0);
        return this;
    }

    public table(columns: { text: string; width: number; align: 'LEFT' | 'RIGHT' }[]): this {
        let line = '';
        for (const col of columns) {
            let str = col.text.substring(0, col.width);
            if (col.align === 'LEFT') {
                str = str.padEnd(col.width, ' ');
            } else {
                str = str.padStart(col.width, ' ');
            }
            line += str;
        }
        this.text(line).newline();
        return this;
    }

    public separator(char: string = '-', width: number = 32): this {
        this.text(char.repeat(width)).newline();
        return this;
    }

    public encode(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}
