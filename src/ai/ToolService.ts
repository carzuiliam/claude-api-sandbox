export class ToolService {
    
    getLocalTime = (): string => {
        const now = new Date();
        const offset = -now.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const minutes = String(Math.abs(offset) % 60).padStart(2, '0');

        return JSON.stringify({
            localTime: now.toLocaleString('sv-SE').replace(' ', 'T'),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utcOffset: `${sign}${hours}:${minutes}`,
        });
    };
    
    searchCep = async (_cep: string): Promise<string> => {
        const response = await fetch(`https://viacep.com.br/ws/${_cep}/json/`);

        if (!response.ok) {
            throw new Error(`ViaCEP request failed with status ${response.status}.`);
        }

        return response.text();
    };
};
