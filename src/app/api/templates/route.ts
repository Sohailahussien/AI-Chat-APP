import { NextRequest, NextResponse } from 'next/server';
import { ChatTemplateManager, ChatTemplate } from '@/services/chatTemplates';

const templateManager = new ChatTemplateManager();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active') === 'true';

    let templates = active ? templateManager.getActiveTemplates() : templateManager.getAllTemplates();
    
    if (category) {
      templates = templates.filter(template => template.category === category);
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, templateId, template, conversation } = body;

    switch (action) {
      case 'activate':
        const activated = templateManager.activateTemplate(templateId);
        return NextResponse.json({
          success: activated,
          message: activated ? 'Template activated' : 'Template not found'
        });

      case 'deactivate':
        const deactivated = templateManager.deactivateTemplate(templateId);
        return NextResponse.json({
          success: deactivated,
          message: deactivated ? 'Template deactivated' : 'Template not found'
        });

      case 'add':
        templateManager.addTemplate(template as ChatTemplate);
        return NextResponse.json({
          success: true,
          message: 'Template added successfully'
        });

      case 'train':
        templateManager.trainWithConversation(conversation, templateId);
        return NextResponse.json({
          success: true,
          message: 'Template trained successfully'
        });

      case 'export':
        const exported = templateManager.exportTemplate(templateId);
        return NextResponse.json({
          success: true,
          template: exported
        });

      case 'import':
        templateManager.importTemplate(template);
        return NextResponse.json({
          success: true,
          message: 'Template imported successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing template action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process template action'
    }, { status: 500 });
  }
}
