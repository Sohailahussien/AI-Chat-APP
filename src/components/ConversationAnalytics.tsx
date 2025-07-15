import React from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ConversationAnalyticsProps {
  messages: Message[];
  activeTools: string[];
}

export const ConversationAnalytics: React.FC<ConversationAnalyticsProps> = ({
  messages,
  activeTools,
}) => {
  // Calculate message statistics
  const messageStats = messages.reduce(
    (stats, msg) => {
      stats[msg.role] = (stats[msg.role] || 0) + 1;
      return stats;
    },
    {} as Record<string, number>
  );

  // Calculate average response time
  const getAverageResponseTime = () => {
    let totalTime = 0;
    let count = 0;

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && messages[i - 1].role === 'user') {
        const timeDiff =
          new Date(messages[i].timestamp).getTime() -
          new Date(messages[i - 1].timestamp).getTime();
        totalTime += timeDiff;
        count++;
      }
    }

    return count > 0 ? totalTime / count : 0;
  };

  const averageResponseTime = getAverageResponseTime();

  // Calculate conversation duration
  const conversationDuration =
    messages.length > 1
      ? new Date(messages[messages.length - 1].timestamp).getTime() -
        new Date(messages[0].timestamp).getTime()
      : 0;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Conversation Analytics</h2>

      {/* Message Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <div className="text-2xl font-bold">{messageStats.user || 0}</div>
          <div className="text-sm text-gray-600">User Messages</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <div className="text-2xl font-bold">{messageStats.assistant || 0}</div>
          <div className="text-sm text-gray-600">AI Responses</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <div className="text-2xl font-bold">{messageStats.system || 0}</div>
          <div className="text-sm text-gray-600">System Messages</div>
        </div>
      </div>

      {/* Time Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <div className="text-lg font-semibold">Average Response Time</div>
          <div className="text-2xl font-bold text-blue-600">
            {(averageResponseTime / 1000).toFixed(2)}s
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-lg font-semibold">Conversation Duration</div>
          <div className="text-2xl font-bold text-green-600">
            {(conversationDuration / 1000 / 60).toFixed(1)}m
          </div>
        </div>
      </div>

      {/* Active Tools */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Active Tools</h3>
        <div className="flex flex-wrap gap-2">
          {activeTools.map((tool, index) => (
            <div
              key={index}
              className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
            >
              {tool}
            </div>
          ))}
        </div>
      </div>

      {/* Message Timeline */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Message Timeline</h3>
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className="flex items-center space-x-2"
              style={{
                marginLeft: `${
                  message.role === 'user' ? '0' : message.role === 'assistant' ? '20px' : '40px'
                }`,
              }}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  message.role === 'user'
                    ? 'bg-blue-500'
                    : message.role === 'assistant'
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
              />
              <div className="text-sm text-gray-600">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
              <div
                className={`text-sm ${
                  message.role === 'system' ? 'italic text-gray-500' : 'text-gray-800'
                }`}
              >
                {message.content.substring(0, 50)}
                {message.content.length > 50 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 