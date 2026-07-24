import 'dotenv/config';
export declare const config: {
    DB_CONNECTION: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_DATABASE: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_SSL: "true" | "false";
};
export declare const dbSsl: boolean;
