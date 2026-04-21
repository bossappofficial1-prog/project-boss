export class EscPosEncoder {
    private buffer: number[] = [];

    constructor() {
        this.initialize();
    }

    public initialize(): this {
        this.buffer.push(0x1B, 0x40);
        return this;
    }

    public text(str: string): this {
        for (let i = 0; i < str.length; i++) {
            this.buffer.push(str.charCodeAt(i));
        }
        return this;
    }

    public newline(): this {
        this.buffer.push(0x0A);
        return this;
    }

    public feed(lines: number = 3): this {
        this.buffer.push(0x1B, 0x64, lines);
        return this;
    }

    public cut(): this {
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

    /**
     * Print a raster bit image (GS v 0)
     * Each byte in 'data' contains 8 horizontal pixels.
     * Width in pixels must be a multiple of 8 for alignment.
     */
    public image(data: Buffer, width: number, height: number): this {
        const xL = (width / 8) % 256;
        const xH = Math.floor((width / 8) / 256);
        const yL = height % 256;
        const yH = Math.floor(height / 256);

        // Command: GS v 0 m xL xH yL yH
        // m=0: normal mode
        this.buffer.push(0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH);
        
        // Add pixel data
        for (let i = 0; i < data.length; i++) {
            this.buffer.push(data[i]);
        }
        
        return this;
    }

    public encode(): Buffer {
        return Buffer.from(this.buffer);
    }
}
