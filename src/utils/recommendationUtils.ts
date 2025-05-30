import { getStressEvents, getGoodThingEvents } from './storageUtils';
import { StressEvent, GoodThingEvent } from '../types';

const analyzeEvents = (events: (StressEvent | GoodThingEvent)[], isStressEvent: boolean) => {
  if (events.length === 0) {
    return isStressEvent ? {
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
      recentHigh: 0,
      hasData: false
    } : {
      big: 0,
      medium: 0,
      small: 0,
      total: 0,
      recentBig: 0,
      selfFocus: 0,
      othersFocus: 0,
      hasData: false
    };
  }

  const now = new Date();
  const weightedEvents = events.map(event => {
    const eventDate = new Date(event.timestamp);
    const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
    const weight = daysDiff <= 3 ? 2.0 - (daysDiff / 3) * 0.5 : Math.max(0.2, 1.0 - (daysDiff / 14));
    return { event, weight };
  });

  if (isStressEvent) {
    const stressLevels = {
      high: 0,
      medium: 0,
      low: 0,
      total: events.length,
      recentHigh: 0,
      hasData: true,
      latestLevel: (events[0] as StressEvent).level
    };

    weightedEvents.forEach(({ event, weight }) => {
      const e = event as StressEvent;
      stressLevels[e.level] += weight;
      
      if (e.level === 'high' && weight > 1.2) {
        stressLevels.recentHigh++;
      }
    });

    return stressLevels;
  } else {
    const goodThingLevels = {
      big: 0,
      medium: 0,
      small: 0,
      total: events.length,
      recentBig: 0,
      selfFocus: 0,
      othersFocus: 0,
      hasData: true,
      latestLevel: (events[0] as GoodThingEvent).level
    };

    weightedEvents.forEach(({ event, weight }) => {
      const e = event as GoodThingEvent;
      goodThingLevels[e.level] += weight;
      
      if (e.level === 'big' && weight > 1.2) {
        goodThingLevels.recentBig++;
      }

      const note = e.note?.toLowerCase() || '';
      if (note.includes('私') || note.includes('自分') || note.includes('僕')) {
        goodThingLevels.selfFocus += weight;
      } else if (note.includes('人') || note.includes('友達') || note.includes('家族')) {
        goodThingLevels.othersFocus += weight;
      }
    });

    return goodThingLevels;
  }
};