                    <FullCalendar
                      plugins={[timeGridPlugin,interaction]}
                      initialView="timeGridWeek"
                      headerToolbar={{
                        left: "",
                        center: "",
                        right: "timeGridWeek"
                      }}
                      events={fcEvents}
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