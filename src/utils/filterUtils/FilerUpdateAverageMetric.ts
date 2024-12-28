import { FileUpdateMetric } from "./FileUpdateMetric";

export class FilerUpdateAverageMetric extends FileUpdateMetric {
    evaluateTimestamps(timestamps: Date[]): number {
        let sum = 0;
        for (let i = 1; i < timestamps.length; i++) {
            sum += Math.abs(timestamps[i].getTime() - timestamps[i - 1].getTime());
        }
        return sum / timestamps.length;
    }
}