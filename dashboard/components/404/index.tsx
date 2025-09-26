import "./404.css"

export default function NotFoundSVG() {
    return (
        <div className="container-svg">
            <svg viewBox="0 0 600 400" className="error-svg" xmlns="http://www.w3.org/2000/svg">

                <g transform="translate(20, 160)">
                    <ellipse id="bayangan-robot" className="robot-shadow" cx="60" cy="180" rx="60" ry="10" />

                    <g id="robot-utuh">
                        <rect id="lengan-kiri" className="robot-accent" x="5" y="80" width="20" height="60" rx="10" />
                        <rect id="lengan-kanan" className="robot-accent" x="95" y="80" width="20" height="60" rx="10" />
                        <rect className="robot-body" x="10" y="70" width="100" height="100" rx="15" />
                        <rect className="robot-accent" x="35" y="95" width="50" height="50" rx="5" />

                        <g id="bagian-berputar">
                            <rect className="robot-accent" x="45" y="50" width="30" height="20" />
                            <g>
                                <rect className="robot-body" x="0" y="0" width="120" height="60" rx="25" />
                                <rect className="robot-visor" x="15" y="15" width="90" height="30" rx="10" />
                                <circle id="mata-robot-kiri" className="robot-visor-glow" cx="35" cy="30" r="5" />
                                <circle id="mata-robot-kanan" className="robot-visor-glow" cx="85" cy="30" r="5" />
                                <line x1="90" y1="0" x2="100" y2="-20" strokeWidth="4" className="robot-body" />
                                <circle id="lampu-antena" className="robot-visor-glow" cx="100" cy="-20" r="5" />
                            </g>
                        </g>
                    </g>
                </g>

                <text x="55%" y="55%" dominantBaseline="middle" textAnchor="middle" className="text-404">404</text>

                <text x="55%" y="75%" textAnchor="middle" className="text-main">
                    Sepertinya Anda Tersesat
                </text>
                <text x="55%" y="82%" textAnchor="middle" className="text-subtitle">
                    Halaman yang Anda cari tidak ada atau sudah dipindahkan.
                </text>
            </svg>
        </div>
    )
}