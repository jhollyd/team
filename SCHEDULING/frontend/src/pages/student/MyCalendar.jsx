import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function MyCalendar({ tempEvents, setTempEvents }) {
    let lastClickTime = null;
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [firstEventDate, setFirstEventDate] = useState(null);

    const handleDateClick = (info) => {
        const currentClickTime = Date.now();
      
        if (lastClickTime && currentClickTime - lastClickTime <= 700) {
            const newEvent = {
                id: String(tempEvents.length + 1),
                title: `Available`,
                start: info.dateStr,
                source: "manual",
            };
            setTempEvents([...tempEvents, newEvent]);
        }

        lastClickTime = currentClickTime;
    };

    const handleEventDrop = (info) => {
        setTempEvents((prev) =>
            prev.map((event) =>
                event.id === info.event.id
                    ? { ...event, start: info.event.startStr, end: info.event.endStr }
                    : event
            )
        );
    };

    const handleEventResize = (info) => {
        setTempEvents((prev) =>
            prev.map((event) =>
                event.id === info.event.id
                    ? { ...event, start: info.event.startStr, end: info.event.endStr }
                    : event
            )
        );
    };

    const handleEventClick = (info) => {
        const clickedEvent = tempEvents.find((event) => event.id === info.event.id);
        if (clickedEvent) {
            setSelectedEvent(clickedEvent);
        }
    };

    const handleDeleteEvent = () => {
        if (selectedEvent && selectedEvent.source !== "ics") {
            setTempEvents((prevEvents) =>
                prevEvents.filter((event) => event.id !== selectedEvent.id)
            );
            console.log(`Event deleted: ${selectedEvent.title}`);
            setSelectedEvent(null);
        }
    };

    useEffect(() => {
        if (selectedEvent) {
            const handleKeyPress = (event) => {
                if (event.key === "Delete" || event.key === "Backspace") {
                    handleDeleteEvent();
                }
            };

            window.addEventListener("keydown", handleKeyPress);

            return () => {
                window.removeEventListener("keydown", handleKeyPress);
            };
        }
    }, [selectedEvent]);

    const setFirstWeekRange = (events) => {
        if (events.length > 0) {
            const sortedEvents = events.sort((a, b) => new Date(a.start) - new Date(b.start));
            const firstEventDate = new Date(sortedEvents[0].start);
            const firstDayOfWeek = firstEventDate.getDate() - firstEventDate.getDay();
            const firstWeekStartDate = new Date(firstEventDate.setDate(firstDayOfWeek));

            setFirstEventDate(firstWeekStartDate);
        }
    };

    useEffect(() => {
        setFirstWeekRange(tempEvents);
    }, [tempEvents]);

    // Helper to map events to the current week (Monday–Friday)
    function mapEventsToCurrentWeek(events) {
        const now = new Date();
        const currentDay = now.getDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
        const monday = new Date(now.setDate(now.getDate() + diff));
        monday.setHours(0, 0, 0, 0);

        return events
            .map(event => {
                const start = new Date(event.start);
                const end = event.end ? new Date(event.end) : new Date(event.start);
                const dayOfWeek = start.getDay();
                // Skip weekends
                if (dayOfWeek === 0 || dayOfWeek === 6) return null;
                // Create new dates for the current week
                const adjustedStart = new Date(monday);
                adjustedStart.setDate(monday.getDate() + (dayOfWeek - 1));
                adjustedStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
                const adjustedEnd = new Date(adjustedStart);
                const duration = end.getTime() - start.getTime();
                adjustedEnd.setTime(adjustedStart.getTime() + duration);
                // Adjust end time if it's after 20:00
                if (adjustedEnd.getHours() > 20) {
                    adjustedEnd.setHours(20, 0, 0, 0);
                }
                // Only add events that start during working hours
                if (adjustedStart.getHours() >= 8) {
                    return {
                        ...event,
                        start: adjustedStart.toISOString(),
                        end: adjustedEnd.toISOString(),
                    };
                }
                return null;
            })
            .filter(Boolean);
    }

    // Use mapped events for the calendar
    const mappedEvents = mapEventsToCurrentWeek(tempEvents);

    return (
        <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
                left: "",
                center: "",
                right: "timeGridWeek"
            }}
            events={mappedEvents}
            editable={true}
            selectable={true}
            droppable={true}
            eventResizableFromStart={true}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            dayHeaderFormat={{ weekday: 'long' }}
            titleFormat={{ month: 'long', year: 'numeric' }}
            slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }}
            nowIndicator={true}
            weekends={false}
            eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }}
            eventDisplay="block"
            eventMinHeight={20}
            slotDuration="00:15:00"
            snapDuration="00:15:00"
            expandRows={true}
            stickyHeaderDates={true}
            dayMaxEvents={true}
            initialDate={new Date()}
            firstDay={1}
            eventContent={(eventInfo) => {
                return {
                    html: `
                        <div class="fc-event-main-frame">
                            <div class="fc-event-title-container">
                                <div class="fc-event-title fc-sticky">${eventInfo.event.title}</div>
                            </div>
                        </div>
                    `
                };
            }}
            eventDidMount={(info) => {
                console.log('Event mounted:', info.event);
            }}
            eventDataTransform={(event) => {
                console.log('Transforming event:', event);
                const transformed = {
                    ...event,
                    start: new Date(event.start),
                    end: new Date(event.end)
                };
                
                // Adjust end time if it's after 20:00
                if (transformed.end.getHours() > 20) {
                    transformed.end.setHours(20, 0, 0, 0);
                }
                
                // Only add events that start during working hours
                if (transformed.start.getHours() >= 8) {
                    console.log('Transformed event:', transformed);
                    return transformed;
                }
            }}
            eventOverlap={false}
            slotEventOverlap={false}
        />
    );
}

export default MyCalendar;
